/* eslint-disable @typescript-eslint/no-explicit-any */
interface TronProvider {
  isTronLink?: boolean;
  request(args: { method: string; params?: unknown }): Promise<unknown>;
  tronWeb: any | false;
  on?: (event: string, listener: (...args: any[]) => void) => unknown;
  removeListener?: (event: string, listener: (...args: any[]) => void) => unknown;
}

interface Window {
  tron?: TronProvider;
  ethereum?: {
    isTrust?: boolean;
    request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  };
}
