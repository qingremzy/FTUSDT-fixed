/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { getTronProvider, getTronWeb, connectWallet } from '../utils/web3Config';

export const useWeb3 = () => {
  const [web3, setWeb3] = useState<any | null>(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncWallet = useCallback((providerOverride?: any) => {
    const provider = providerOverride || (typeof window !== 'undefined' ? window.tron : undefined);
    const instance = provider?.tronWeb;
    if (instance && instance !== false && instance.ready && instance.defaultAddress?.base58) {
      setWeb3(instance);
      setAccount(instance.defaultAddress.base58);
      setError('');
    } else {
      setWeb3(null);
      setAccount('');
    }
  }, []);

  useEffect(() => {
    let active = true;
    let provider: any;

    const initializeProvider = async () => {
      try {
        provider = await getTronProvider();
        if (!active) return;
        syncWallet(provider);
        provider.on?.('accountsChanged', () => syncWallet(provider));
        provider.on?.('chainChanged', () => syncWallet(provider));
        provider.on?.('disconnect', () => {
          setWeb3(null);
          setAccount('');
        });
      } catch {
        // Wallet discovery is passive. The user can still connect later.
      }
    };

    initializeProvider();
    return () => {
      active = false;
      provider?.removeListener?.('accountsChanged', syncWallet);
      provider?.removeListener?.('chainChanged', syncWallet);
    };
  }, [syncWallet]);

  const connect = async () => {
    try {
      setLoading(true);
      setError('');
      await connectWallet();
      const instance = await getTronWeb();
      setWeb3(instance);
      setAccount(instance.defaultAddress.base58);
      return instance.defaultAddress.base58;
    } catch (err: any) {
      const message = err?.message || 'TRON wallet connection failed.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { web3, account, loading, error, connect };
};
