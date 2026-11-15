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
    mapping(address => uint256) public coverageBalance;
    mapping(address => uint256) public coverageCommitted;
    mapping(address => uint256) public coverageExpiry;

    uint256 public totalClaims;
    uint256 public totalPaidOut;
    uint256 public totalPremiumsCollected;
    uint256 public totalCoverageLiability;

    uint256 public constant CLAIM_REVIEW_PERIOD = 3 days;
    uint256 public constant COVERAGE_PERIOD = 30 days;
    uint256 public constant MAX_CLAIM_AMOUNT = 100000 * 10**6; // 100,000 FTUSDT
    uint256 public constant PREMIUM_RATE = 1; // 0.1% of purchased coverage, in FTUSDT base units

    bool private _entered;

    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event ClaimResolved(uint256 indexed claimId, ClaimStatus status);
    event PremiumPaid(address indexed user, uint256 premium, uint256 coverageAmount, uint256 coverageExpiry);
    event ClaimPaid(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event FTUSDTSet(address indexed token);
    event CoveragePurchased(address indexed user, uint256 coverageAmount, uint256 premium, uint256 expiry);

    modifier nonReentrant() {
        require(!_entered, "ReentrancyGuard: reentrant call");
        _entered = true;
        _;
        _entered = false;
    }

    // The token is linked after FTUSDT is deployed to avoid a circular deployment dependency.
    function setFTUSDT(address token) external onlyOwner {
        require(token != address(0) && token.code.length > 0, "Invalid FTUSDT address");
        require(address(ftusdt) == address(0), "FTUSDT already configured");
        ftusdt = ITRC20(token);
        emit FTUSDTSet(token);
    }

    function payPremium(uint256 coverageAmount) external whenNotPaused nonReentrant {
        require(address(ftusdt) != address(0), "FTUSDT not configured");
        require(coverageAmount > 0, "Coverage must be positive");

        uint256 premium = (coverageAmount * PREMIUM_RATE) / 1000;
        require(premium > 0, "Coverage amount too small for premium");
        require(ftusdt.transferFrom(msg.sender, address(this), premium), "Premium payment failed");

        if (coverageExpiry[msg.sender] <= block.timestamp) {
            require(coverageCommitted[msg.sender] == 0, "Pending claims must be resolved before renewal");
            totalCoverageLiability -= coverageBalance[msg.sender];
            coverageBalance[msg.sender] = coverageAmount;
            coverageExpiry[msg.sender] = block.timestamp + COVERAGE_PERIOD;
        } else {
            coverageBalance[msg.sender] += coverageAmount;
            coverageExpiry[msg.sender] += COVERAGE_PERIOD;
        }

        totalCoverageLiability += coverageAmount;
        totalPremiumsCollected += premium;

        emit PremiumPaid(msg.sender, premium, coverageAmount, coverageExpiry[msg.sender]);
        emit CoveragePurchased(msg.sender, coverageAmount, premium, coverageExpiry[msg.sender]);
    }

    function submitClaim(uint256 amount, string calldata reason) external whenNotPaused {
        require(address(ftusdt) != address(0), "FTUSDT not configured");
        require(amount > 0 && amount <= MAX_CLAIM_AMOUNT, "Claim amount invalid");
        require(bytes(reason).length > 0, "Reason required");
        require(coverageExpiry[msg.sender] > block.timestamp, "No active insurance coverage");
        require(
            amount <= coverageBalance[msg.sender] - coverageCommitted[msg.sender],
            "Claim exceeds available coverage"
        );

        uint256 claimId = totalClaims++;
        claims[claimId] = InsuranceClaim({
            claimant: msg.sender,
            amount: amount,
            reason: reason,
            status: ClaimStatus.PENDING,
            timestamp: block.timestamp,
            resolutionTime: 0
        });

        coverageCommitted[msg.sender] += amount;
        userClaims[msg.sender].push(claimId);
        emit ClaimSubmitted(claimId, msg.sender, amount);
    }

    function resolveClaim(uint256 claimId, bool approved) external onlyOwner nonReentrant {
        require(claimId < totalClaims, "Invalid claim ID");
        InsuranceClaim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.PENDING, "Claim not pending");
        require(block.timestamp >= claim.timestamp + CLAIM_REVIEW_PERIOD, "Review period not ended");

        claim.resolutionTime = block.timestamp;
        if (approved) {
            require(ftusdt.balanceOf(address(this)) >= claim.amount, "Insufficient insurance funds");
            claim.status = ClaimStatus.PAID;
            coverageCommitted[claim.claimant] -= claim.amount;
            coverageBalance[claim.claimant] -= claim.amount;
            totalCoverageLiability -= claim.amount;
            totalPaidOut += claim.amount;
            require(ftusdt.transfer(claim.claimant, claim.amount), "Payment failed");
            emit ClaimPaid(claimId, claim.claimant, claim.amount);
        } else {
            claim.status = ClaimStatus.REJECTED;
            coverageCommitted[claim.claimant] -= claim.amount;
        }

        emit ClaimResolved(claimId, claim.status);
    }

    function withdrawExcessFunds(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0 && amount <= getExcessFunds(), "Amount exceeds excess funds");
        require(ftusdt.transfer(owner(), amount), "Transfer failed");
    }

    function getExcessFunds() public view returns (uint256) {
        if (address(ftusdt) == address(0)) return 0;
        uint256 totalBalance = ftusdt.balanceOf(address(this));
        if (totalBalance <= totalCoverageLiability) return 0;
        return totalBalance - totalCoverageLiability;
    }

    function getUserClaims(address user) external view returns (uint256[] memory) {
        return userClaims[user];
    }
}
