// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ITRC20.sol";
import "./Ownable.sol";
import "./Pausable.sol";

contract InsurancePool is Ownable, Pausable {
    ITRC20 public ftusdt;

    struct InsuranceClaim {
        address claimant;
        uint256 amount;
        string reason;
        ClaimStatus status;
        uint256 timestamp;
        uint256 resolutionTime;
    }

    enum ClaimStatus { PENDING, APPROVED, REJECTED, PAID }

    mapping(uint256 => InsuranceClaim) public claims;
    mapping(address => uint256[]) public userClaims;
    uint256 public totalClaims;
    uint256 public totalPaidOut;
    uint256 public totalPremiumsCollected;

    uint256 public constant CLAIM_REVIEW_PERIOD = 3 days;
    uint256 public constant MAX_CLAIM_AMOUNT = 100000 * 10**6;
    uint256 public constant PREMIUM_RATE = 1; // 0.1%, denominated in FTUSDT

    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event ClaimResolved(uint256 indexed claimId, ClaimStatus status);
    event PremiumPaid(address indexed user, uint256 amount);
    event ClaimPaid(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event FTUSDTConfigured(address indexed token);

    constructor(address _ftusdt) {
        // A zero address is allowed only for the one-time circular deployment setup.
        ftusdt = ITRC20(_ftusdt);
    }

    function setFTUSDT(address _ftusdt) external onlyOwner {
        require(address(ftusdt) == address(0), "FTUSDT already configured");
        require(_ftusdt != address(0), "Invalid FTUSDT address");
        ftusdt = ITRC20(_ftusdt);
        emit FTUSDTConfigured(_ftusdt);
    }

    function submitClaim(uint256 amount, string calldata reason) external whenNotPaused {
        require(address(ftusdt) != address(0), "FTUSDT not configured");
        require(amount > 0 && amount <= MAX_CLAIM_AMOUNT, "Invalid claim amount");
        require(bytes(reason).length > 0, "Reason required");

        uint256 claimId = totalClaims++;
        claims[claimId] = InsuranceClaim({
            claimant: msg.sender,
            amount: amount,
            reason: reason,
            status: ClaimStatus.PENDING,
            timestamp: block.timestamp,
            resolutionTime: 0
        });

        userClaims[msg.sender].push(claimId);
        emit ClaimSubmitted(claimId, msg.sender, amount);
    }

    // Premium is 0.1% of the insured coverage amount, collected in FTUSDT.
    // The user must approve this contract for the calculated premium first.
    function payPremium(uint256 coverageAmount) external whenNotPaused {
        require(address(ftusdt) != address(0), "FTUSDT not configured");
        require(coverageAmount > 0, "Coverage amount is zero");
        uint256 premium = (coverageAmount * PREMIUM_RATE) / 1000;
        require(premium > 0, "Premium rounds to zero");
        require(ftusdt.transferFrom(msg.sender, address(this), premium), "Premium transfer failed");
        totalPremiumsCollected += premium;
        emit PremiumPaid(msg.sender, premium);
    }

    function resolveClaim(uint256 claimId, bool approved) external onlyOwner whenNotPaused {
        require(claimId < totalClaims, "Invalid claim ID");
        InsuranceClaim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");
        require(block.timestamp >= claim.timestamp + CLAIM_REVIEW_PERIOD, "Review period not ended");

        if (!approved) {
            claim.status = ClaimStatus.REJECTED;
            claim.resolutionTime = block.timestamp;
            emit ClaimResolved(claimId, claim.status);
            return;
        }

        require(ftusdt.balanceOf(address(this)) >= claim.amount, "Insufficient insurance funds");
        // State updates and transfer are atomic: a failed transfer reverts the status update.
        claim.status = ClaimStatus.PAID;
        claim.resolutionTime = block.timestamp;
        totalPaidOut += claim.amount;
        require(ftusdt.transfer(claim.claimant, claim.amount), "Payment failed");

        emit ClaimPaid(claimId, claim.claimant, claim.amount);
        emit ClaimResolved(claimId, claim.status);
    }

    function withdrawExcessFunds(uint256 amount) external onlyOwner {
        require(address(ftusdt) != address(0), "FTUSDT not configured");
        require(amount > 0 && amount <= getExcessFunds(), "Amount exceeds excess funds");
        require(ftusdt.transfer(owner(), amount), "Transfer failed");
    }

    function getExcessFunds() public view returns (uint256) {
        if (address(ftusdt) == address(0)) return 0;
        uint256 balance = ftusdt.balanceOf(address(this));
        uint256 reserve = totalPaidOut / 2;
        return balance > reserve ? balance - reserve : 0;
    }

    function getUserClaims(address user) external view returns (uint256[] memory) {
        return userClaims[user];
    }
}
