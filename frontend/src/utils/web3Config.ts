/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import BN from 'bn.js';
import CollateralManagerABI from '../contracts/CollateralManager.json';
import FTUSDT_ABI from '../contracts/FTUSDT.json';

export const COLLATERAL_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_COLLATERAL_MANAGER_ADDRESS;
export const FTUSDT_ADDRESS = process.env.NEXT_PUBLIC_FTUSDT_ADDRESS;

/**
 * Create a Web3 instance without requesting wallet permissions.
 * Account access is requested only after the user presses Connect.
 */
export const getWeb3 = async () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    return new Web3(window.ethereum);
  }
  throw new Error('No EVM wallet provider detected. This frontend currently requires an EVM-compatible wallet provider.');
};

export const getCollateralManagerContract = async (web3: Web3) => {
  if (!COLLATERAL_MANAGER_ADDRESS) {
    throw new Error('Collateral Manager contract address not found');
  }
  return new web3.eth.Contract(
    CollateralManagerABI as AbiItem[],
    COLLATERAL_MANAGER_ADDRESS
  );
};

export const getFTUSDTContract = async (web3: Web3) => {
  if (!FTUSDT_ADDRESS) {
    throw new Error('FTUSDT contract address not found');
  }
  return new web3.eth.Contract(
    FTUSDT_ABI as AbiItem[],
    FTUSDT_ADDRESS
  );
};

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('No EVM wallet provider detected.');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet account was returned.');
    }

    return accounts[0];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to connect wallet');
  }
};

export const checkAndSwitchNetwork = async (chainId: string) => {
  if (!window.ethereum) {
    throw new Error('No EVM wallet provider detected.');
  }

  const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
  const expectedChainId = Web3.utils.toHex(chainId);

  if (currentChainId.toLowerCase() !== expectedChainId.toLowerCase()) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: expectedChainId }],
      });
    } catch (error: any) {
      if (error?.code === 4902) {
        throw new Error('The requested EVM network is not configured in your wallet.');
      }
      throw error;
    }
  }
};

// Flash Transaction Helper Functions
export const MIN_FLASH_WINDOW = 60;
export const MAX_FLASH_WINDOW = 31536000;
export const MIN_EXECUTION_DELAY = 60;
export const MAX_FLASH_AMOUNT = '1000000000000'; // 1M FTUSDT at 6 decimals

export const validateFlashTransaction = (
  amount: string,
  timeWindow: number,
  minExecutionTime: number
): string | null => {
  if (!/^\d+(\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) {
    return 'Enter a valid positive amount with no more than 6 decimal places';
  }

  // FTUSDT declares 6 decimals. Avoid Web3's default 18-decimal ether conversion.
  const [whole, fraction = ''] = amount.split('.');
  const amountBaseUnits = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
  if (amountBaseUnits > BigInt(MAX_FLASH_AMOUNT)) {
    return 'Amount exceeds maximum allowed';
  }

  if (timeWindow < MIN_FLASH_WINDOW || timeWindow > MAX_FLASH_WINDOW) {
    return 'Invalid time window';
  }

  if (minExecutionTime < MIN_EXECUTION_DELAY) {
    return 'Execution delay too short';
  }

  return null;
};
