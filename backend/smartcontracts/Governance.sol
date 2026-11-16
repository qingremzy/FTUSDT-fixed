// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IGovernance.sol";
import "./Ownable.sol";

interface IFTUSDTGovernanceTarget {
    function updateParameters(bytes32 parameter, uint256 newValue) external;
    function governanceEmergencyAction(bytes32 actionId) external;
    function governanceUpdateOracle(address newOracle) external;
}

contract Governance is IGovernance, Ownable {
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant MIN_VOTING_POWER = 100 * 10**6; // FTUSDT has 6 decimals.
    uint256 public proposalCount;
    address public executionTarget;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ExecutionTargetSet(address indexed target);
    event VotingPowerUpdated(address indexed voter, uint256 newVotingPower);

    modifier onlyValidProposal(uint256 proposalId) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        require(!proposals[proposalId].executed, "Proposal already executed");
        require(!proposals[proposalId].canceled, "Proposal already canceled");
        _;
    }

    modifier onlyDuringVoting(uint256 proposalId) {
        require(block.timestamp >= proposals[proposalId].votingStart, "Voting not started");
        require(block.timestamp <= proposals[proposalId].votingEnd, "Voting ended");
        _;
    }

    constructor() {}

    function setExecutionTarget(address target) external onlyOwner {
        require(executionTarget == address(0), "Execution target already set");
        require(target != address(0) && target.code.length > 0, "Invalid execution target");
        executionTarget = target;
        emit ExecutionTargetSet(target);
    }

    function propose(
        ProposalType proposalType,
        bytes32 parameterId,
        uint256 newValue
    ) external override returns (uint256) {
        require(votingPower[msg.sender] >= MIN_VOTING_POWER, "Insufficient voting power");
        require(executionTarget != address(0), "Execution target not set");

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.proposalType = proposalType;
        proposal.parameterId = parameterId;
        proposal.newValue = newValue;
        proposal.votingStart = block.timestamp;
        proposal.votingEnd = block.timestamp + VOTING_PERIOD;

        emit ProposalCreated(proposalCount, msg.sender, proposalType);
        return proposalCount;
    }

    function vote(uint256 proposalId, bool support)
        external
        override
        onlyValidProposal(proposalId)
        onlyDuringVoting(proposalId)
    {
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        uint256 weight = votingPower[msg.sender];
        require(weight > 0, "No voting power");

        Proposal storage proposal = proposals[proposalId];
        if (support) proposal.votesFor += weight;
        else proposal.votesAgainst += weight;

        hasVoted[proposalId][msg.sender] = true;
        emit Voted(proposalId, msg.sender, support, weight);
    }

    function execute(uint256 proposalId)
        external
        override
        onlyValidProposal(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.votingEnd + EXECUTION_DELAY, "Execution delay not met");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal not passed");

        // Reverts atomically if the target does not support the requested action.
        if (proposal.proposalType == ProposalType.PARAMETER_CHANGE) {
            IFTUSDTGovernanceTarget(executionTarget).updateParameters(
                proposal.parameterId,
                proposal.newValue
            );
        } else if (proposal.proposalType == ProposalType.EMERGENCY_ACTION) {
            IFTUSDTGovernanceTarget(executionTarget).governanceEmergencyAction(
                proposal.parameterId
            );
        } else if (proposal.proposalType == ProposalType.ORACLE_CHANGE) {
            require(proposal.newValue <= type(uint160).max, "Oracle address overflow");
            address newOracle = address(uint160(proposal.newValue));
            require(newOracle != address(0) && newOracle.code.length > 0, "Invalid oracle");
            IFTUSDTGovernanceTarget(executionTarget).governanceUpdateOracle(newOracle);
        } else {
            // FTUSDT is not an upgradeable proxy. Do not pretend an upgrade was performed.
            revert("Protocol is not upgradeable");
        }

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId)
        external
        override
        onlyValidProposal(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.proposer || msg.sender == owner(), "Not authorized");
        require(block.timestamp <= proposal.votingEnd, "Voting period ended");
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function updateVotingPower(address voter, uint256 newVotingPower) external onlyOwner {
        require(voter != address(0), "Invalid voter");
        votingPower[voter] = newVotingPower;
        emit VotingPowerUpdated(voter, newVotingPower);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[proposalId];
    }

    function getVotingPower(address voter) external view returns (uint256) {
        return votingPower[voter];
    }
}
