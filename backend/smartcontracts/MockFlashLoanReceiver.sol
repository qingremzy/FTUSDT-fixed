// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ITRC20.sol";
import "./IFlashLoanReceiver.sol";

/// @dev Test helper only. Repays principal and fee using the borrowed amount plus pre-funded fee.
contract MockFlashLoanReceiver is IFlashLoanReceiver {
    ITRC20 public immutable token;

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Invalid token");
        token = ITRC20(tokenAddress);
    }

    function executeOperation(uint256 amount, uint256 fee, bytes calldata)
        external
        override
        returns (bool)
    {
        require(msg.sender == address(token), "Only FTUSDT");
        require(token.transfer(msg.sender, amount + fee), "Repayment failed");
        return true;
    }
}
