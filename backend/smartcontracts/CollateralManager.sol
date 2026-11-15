// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ICollateralManager.sol";
import "./Ownable.sol";
import "./ITRC20.sol";

/**
 * @title Collateral Manager for FTUSDT
 * @dev Holds collateral and permits only the linked FTUSDT contract to move it.
 */
contract CollateralManager is ICollateralManager, Ownable {
    ITRC20 public collateralToken;
    address public ftusdt;

    event CollateralTokenSet(address token);
    event FTUSDTSet(address token);
    event CollateralTransferred(address from, address to, uint256 amount);

    modifier onlyFTUSDT() {
        require(ftusdt != address(0) && msg.sender == ftusdt, "Only FTUSDT");
        _;
    }

    constructor() {
        collateralToken = ITRC20(address(0));
    }

    function setFTUSDT(address token) external onlyOwner {
        require(token != address(0), "Invalid FTUSDT address");
        require(ftusdt == address(0), "FTUSDT already configured");
        ftusdt = token;
        emit FTUSDTSet(token);
    }

    function setCollateralToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(
            address(collateralToken) == address(0) || collateralToken.balanceOf(address(this)) == 0,
            "Cannot change collateral token while funds are held"
        );
        collateralToken = ITRC20(token);
        emit CollateralTokenSet(token);
    }

    function collateralDecimals() external view override returns (uint8) {
        require(address(collateralToken) != address(0), "Collateral token not set");
        return collateralToken.decimals();
    }

    function transferCollateralFrom(
        address from,
        address to,
        uint256 amount
    ) external override onlyFTUSDT returns (bool) {
        require(address(collateralToken) != address(0), "Collateral token not set");
        require(to == address(this), "Collateral must be held by manager");
        require(
            collateralToken.transferFrom(from, address(this), amount),
            "Collateral transfer failed"
        );
        emit CollateralTransferred(from, address(this), amount);
        return true;
    }

    function transferCollateral(
        address to,
        uint256 amount
    ) external override onlyFTUSDT returns (bool) {
        require(address(collateralToken) != address(0), "Collateral token not set");
        require(to != address(0), "Invalid recipient");
        require(
            collateralToken.transfer(to, amount),
            "Collateral transfer failed"
        );
        emit CollateralTransferred(address(this), to, amount);
        return true;
    }
}
