// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ICollateralManager.sol";
import "./Ownable.sol";
import "./ITRC20.sol";

/**
 * @title Collateral Manager for FTUSDT
 * @dev Manages collateral tokens for the FTUSDT stablecoin
 */
contract CollateralManager is ICollateralManager, Ownable {
    ITRC20 public collateralToken;
    address public protocol;

    modifier onlyProtocol() {
        require(msg.sender == protocol && protocol != address(0), "Only protocol");
        _;
    }
    
    event CollateralTokenSet(address token);
    event CollateralTransferred(address from, address to, uint256 amount);
    
    constructor() {
        // Initialize with a dummy address, must be set later
        collateralToken = ITRC20(address(0));
    }
    
    function setCollateralToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        collateralToken = ITRC20(token);
        emit CollateralTokenSet(token);
    }

    function setProtocol(address _protocol) external onlyOwner {
        require(protocol == address(0), "Protocol already configured");
        require(_protocol != address(0), "Invalid protocol address");
        protocol = _protocol;
    }
    
    function transferCollateralFrom(
        address from,
        address to,
        uint256 amount
    ) external override onlyProtocol returns (bool) {
        require(address(collateralToken) != address(0), "Collateral token not set");
        require(to == address(this), "Collateral must enter the vault");
        require(from != address(0) && amount > 0, "Invalid collateral deposit");
        require(
            collateralToken.transferFrom(from, address(this), amount),
            "Collateral transfer failed"
        );
        emit CollateralTransferred(from, to, amount);
        return true;
    }
    
    function transferCollateral(
        address to,
        uint256 amount
    ) external override onlyProtocol returns (bool) {
        require(address(collateralToken) != address(0), "Collateral token not set");
        require(to != address(0) && amount > 0, "Invalid collateral withdrawal");
        require(
            collateralToken.transfer(to, amount),
            "Collateral transfer failed"
        );
        emit CollateralTransferred(address(this), to, amount);
        return true;
    }
}
