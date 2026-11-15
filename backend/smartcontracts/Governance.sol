// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IGovernance.sol";
import "./Ownable.sol";

interface IFTUSDTGovernanceTarget {
    function updateParameters(bytes32 parameter, uint256 newValue) external;
    function governanceEmergencyAction(bytes32 action) external;
    function updateOracle(address newOracle) external;
}

contract Governance is IGovernance, Ownable {
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant MIN_VOTING_POWER = 100 * 10**6; // 100 FTUSDT at 6 decimals
    uint256 public proposalCount;

    address public protocol;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProtocolConfigured(address indexed protocol);
    event VotingPowerUpdated(address indexed user, uint256 newVotingPower);

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

    function setProtocol(address protocolAddress) external onlyOwner {
        require(protocol == address(0), "Protocol already configured");
        require(protocolAddress != address(0) && protocolAddress.code.length > 0, "Invalid protocol");
        protocol = protocolAddress;
        emit ProtocolConfigured(protocolAddress);
    }

    function propose(
        ProposalType proposalType,
        bytes32 parameterId,
        uint256 newValue
    ) external override returns (uint256) {
        require(votingPower[msg.sender] >= MIN_VOTING_POWER, "Insufficient voting power");
        require(proposalType != ProposalType.PROTOCOL_UPGRADE, "Protocol upgrades are not supported");
        if (proposalType == ProposalType.ORACLE_CHANGE) {
            require(parameterId == bytes32("ORACLE_ADDRESS"), "Unsupported oracle proposal");
            require(newValue > 0 && newValue <= type(uint160).max, "Invalid oracle address");
        }
        if (proposalType == ProposalType.EMERGENCY_ACTION) {
            require(
                parameterId == bytes32("PAUSE") || parameterId == bytes32("UNPAUSE"),
                "Unsupported emergency action"
            );
        }

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
        require(votingPower[msg.sender] > 0, "No voting power");

        Proposal storage proposal = proposals[proposalId];
        uint256 weight = votingPower[msg.sender];
        if (support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }

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
        require(proposal.votesFor > proposal.votesAgainst && proposal.votesFor > 0, "Proposal not passed");
        require(protocol != address(0), "Protocol not configured");

        // A failed target call reverts this state change as part of the same transaction.
        proposal.executed = true;
        IFTUSDTGovernanceTarget target = IFTUSDTGovernanceTarget(protocol);

        if (proposal.proposalType == ProposalType.PARAMETER_CHANGE) {
            target.updateParameters(proposal.parameterId, proposal.newValue);
        } else if (proposal.proposalType == ProposalType.EMERGENCY_ACTION) {
            target.governanceEmergencyAction(proposal.parameterId);
        } else if (proposal.proposalType == ProposalType.ORACLE_CHANGE) {
            target.updateOracle(address(uint160(proposal.newValue)));
        } else {
            revert("Unsupported proposal type");
        }

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

    function updateVotingPower(address user, uint256 newVotingPower) external onlyOwner {
        require(user != address(0), "Invalid voter");
        votingPower[user] = newVotingPower;
        emit VotingPowerUpdated(user, newVotingPower);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[proposalId];
    }

    function getVotingPower(address user) external view returns (uint256) {
        return votingPower[user];
    }
}
