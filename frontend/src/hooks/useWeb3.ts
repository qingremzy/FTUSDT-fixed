/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { getTronProvider, getTronWeb, connectWallet } from '../utils/web3Config';

export const useWeb3 = () => {
  const [web3, setWeb3] = useState<any | null>(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<any | null>(null);

  const syncWallet = useCallback((source?: any) => {
    const activeProvider = source || provider;
    const instance = activeProvider?.tronWeb;
    if (instance && instance !== false && instance.ready && instance.defaultAddress?.base58) {
      setWeb3(instance);
      setAccount(instance.defaultAddress.base58);
      setError('');
    } else {
      setWeb3(null);
      setAccount('');
    }
  }, [provider]);

  useEffect(() => {
    let active = true;
    getTronProvider()
      .then(found => {
        if (active) setProvider(found);
      })
      .catch(() => {
        // Passive discovery is optional. The user can connect later.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!provider) return;
    const handleAccountsChanged = () => syncWallet(provider);
    const handleChainChanged = () => syncWallet(provider);
    const handleDisconnect = () => {
      setWeb3(null);
      setAccount('');
    };

    syncWallet(provider);
    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);
    provider.on?.('disconnect', handleDisconnect);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
      provider.removeListener?.('disconnect', handleDisconnect);
    };
  }, [provider, syncWallet]);

  const connect = async () => {
    try {
      setLoading(true);
      setError('');
      const foundProvider = await getTronProvider();
      setProvider(foundProvider);
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
