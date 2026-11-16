// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ITRC20.sol";
import "./Ownable.sol";

/**
 * @dev Nile-testnet-only collateral token. This is not a real asset or stablecoin.
 * The deployer can mint test tokens for exercising FTUSDT collateral flows.
 */
contract MockCollateral is ITRC20, Ownable {
    string public constant name = "Mock Collateral";
    string public constant symbol = "mCOL";
    uint8 public constant decimals = 6;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(uint256 initialSupply) {
        _mint(msg.sender, initialSupply * 10 ** uint256(decimals));
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function allowance(address account, address spender) external view override returns (uint256) {
        return _allowances[account][spender];
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        require(msg.sender != address(0) && spender != address(0), "Invalid address");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        uint256 allowed = _allowances[sender][msg.sender];
        require(allowed >= amount, "Allowance exceeded");
        _allowances[sender][msg.sender] = allowed - amount;
        emit Approval(sender, msg.sender, _allowances[sender][msg.sender]);
        _transfer(sender, recipient, amount);
        return true;
    }

    function mint(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0) && recipient != address(0), "Invalid address");
        require(_balances[sender] >= amount, "Insufficient balance");
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address recipient, uint256 amount) internal {
        require(recipient != address(0), "Invalid recipient");
        _totalSupply += amount;
        _balances[recipient] += amount;
        emit Transfer(address(0), recipient, amount);
    }
}
