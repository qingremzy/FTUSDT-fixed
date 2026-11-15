/* eslint-disable @typescript-eslint/no-explicit-any */
import FTUSDT_ABI from '../contracts/FTUSDT.json';

export const FTUSDT_ADDRESS = process.env.NEXT_PUBLIC_FTUSDT_ADDRESS?.trim() || '';

export const getTronWeb = async (): Promise<any> => {
  if (typeof window === 'undefined' || !window.tron) {
    throw new Error('No TRON wallet detected. Open this page in a TRON wallet browser such as TronLink.');
  }
  const tronWeb = window.tron.tronWeb;
  if (!tronWeb || !tronWeb.ready || !tronWeb.defaultAddress?.base58) {
    throw new Error('TRON wallet is not authorized yet. Press Connect Wallet first.');
  }
  return tronWeb;
};

export const connectWallet = async (): Promise<string> => {
  if (typeof window === 'undefined' || !window.tron) {
    throw new Error('No TRON wallet detected. Open this page in a TRON wallet browser such as TronLink.');
  }
  await window.tron.request({ method: 'eth_requestAccounts' });
  const tronWeb = window.tron.tronWeb;
  if (!tronWeb || !tronWeb.ready || !tronWeb.defaultAddress?.base58) {
    throw new Error('Wallet authorization did not return a TRON account.');
  }
  return tronWeb.defaultAddress.base58;
};

export const getFTUSDTContract = async (tronWeb: any) => {
  if (!FTUSDT_ADDRESS) {
    throw new Error('FTUSDT contract address is not configured. No contract calls are enabled.');
  }
  if (!tronWeb.isAddress(FTUSDT_ADDRESS)) {
    throw new Error('Configured FTUSDT address is not a valid TRON address.');
  }
  return tronWeb.contract(FTUSDT_ABI, FTUSDT_ADDRESS);
};

export const toSmallestUnit = (value: string, decimals = 6): string => {
  if (!/^\d+(\.\d+)?$/.test(value)) throw new Error('Enter a valid positive amount.');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) throw new Error(`Maximum precision is ${decimals} decimal places.`);
  const result = (whole + fraction.padEnd(decimals, '0')).replace(/^0+(?=\d)/, '');
  if (!/[1-9]/.test(result)) throw new Error('Amount must be greater than zero.');
  return result;
};

export const fromSmallestUnit = (value: unknown, decimals = 6): string => {
  const raw = String(value);
  if (!/^\d+$/.test(raw)) throw new Error('Wallet returned an invalid token balance.');
  const padded = raw.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
};

export const validateTronAddress = (tronWeb: any, address: string): boolean =>
  Boolean(address && tronWeb?.isAddress?.(address));
