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
    uint256 public constant MAX_CLAIM_AMOUNT = 100000 * 10**6; // 100,000 FTUSDT
    uint256 public constant PREMIUM_RATE = 1; // 0.1% premium rate

    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event ClaimResolved(uint256 indexed claimId, ClaimStatus status);
    event PremiumPaid(address indexed user, uint256 amount);
    event ClaimPaid(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event FTUSDTSet(address indexed token);

    // The token is linked after FTUSDT is deployed to avoid a circular deployment dependency.
    function setFTUSDT(address token) external onlyOwner {
        require(token != address(0), "Invalid FTUSDT address");
        require(address(ftusdt) == address(0), "FTUSDT already configured");
        ftusdt = ITRC20(token);
        emit FTUSDTSet(token);
    }

    function submitClaim(uint256 amount, string calldata reason) external whenNotPaused {
        require(address(ftusdt) != address(0), "FTUSDT not configured");
        require(amount > 0 && amount <= MAX_CLAIM_AMOUNT, "Claim amount invalid");
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

    function resolveClaim(uint256 claimId, bool approved) external onlyOwner {
        InsuranceClaim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");
        require(block.timestamp >= claim.timestamp + CLAIM_REVIEW_PERIOD, "Review period not ended");

        if (approved) {
            require(ftusdt.balanceOf(address(this)) >= claim.amount, "Insufficient insurance funds");
            claim.status = ClaimStatus.APPROVED;
            require(ftusdt.transfer(claim.claimant, claim.amount), "Payment failed");
            claim.status = ClaimStatus.PAID;
            claim.resolutionTime = block.timestamp;
            totalPaidOut += claim.amount;
            emit ClaimPaid(claimId, claim.claimant, claim.amount);
        } else {
            claim.status = ClaimStatus.REJECTED;
            claim.resolutionTime = block.timestamp;
        }

        emit ClaimResolved(claimId, claim.status);
    }

    function payPremium() external payable whenNotPaused {
        uint256 premium = (msg.value * PREMIUM_RATE) / 1000;
        totalPremiumsCollected += premium;
        emit PremiumPaid(msg.sender, premium);
    }

    function withdrawExcessFunds(uint256 amount) external onlyOwner {
        require(amount <= getExcessFunds(), "Amount exceeds excess funds");
        require(ftusdt.transfer(owner(), amount), "Transfer failed");
    }

    function getExcessFunds() public view returns (uint256) {
        if (address(ftusdt) == address(0)) return 0;
        uint256 totalBalance = ftusdt.balanceOf(address(this));
        uint256 requiredReserves = totalPaidOut / 2;
        if (totalBalance <= requiredReserves) return 0;
        return totalBalance - requiredReserves;
    }

    function getUserClaims(address user) external view returns (uint256[] memory) {
        return userClaims[user];
    }
}
