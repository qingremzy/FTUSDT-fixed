/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { getWeb3, connectWallet } from '../utils/web3Config';

export const useWeb3 = () => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    setAccount(accounts?.[0] ?? '');
  }, []);

  useEffect(() => {
    let mounted = true;

    // Provider initialization must not trigger a wallet permission prompt.
    getWeb3()
      .then(async (instance) => {
        if (!mounted) return;
        setWeb3(instance);
        const accounts = await instance.eth.getAccounts();
        if (mounted && accounts[0]) setAccount(accounts[0]);
      })
      .catch((err: any) => {
        if (mounted) setError(err?.message || 'Wallet provider unavailable');
      });

    const provider = typeof window !== 'undefined' ? window.ethereum : undefined;
    provider?.on?.('accountsChanged', handleAccountsChanged);
    provider?.on?.('chainChanged', () => {
      // Refresh provider state after a network change.
      window.location.reload();
    });

    return () => {
      mounted = false;
      provider?.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, [handleAccountsChanged]);

  const connect = async () => {
    try {
      setLoading(true);
      setError('');

      // Do not silently switch users to BNB testnet. The repository's
      // deployment configuration targets TRON Nile, so network alignment
      // must be verified before any transaction feature is used.
      const userAccount = await connectWallet();
      const web3Instance = await getWeb3();
      setWeb3(web3Instance);
      setAccount(userAccount);
      return userAccount;
    } catch (err: any) {
      const message = err?.message || 'Wallet connection failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    web3,
    account,
    loading,
    error,
    connect,
  };
};
