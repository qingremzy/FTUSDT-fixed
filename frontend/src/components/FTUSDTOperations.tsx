/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useWeb3Context } from '../context/Web3Context';
import { getFTUSDTContract, fromSmallestUnit, toSmallestUnit, validateTronAddress } from '../utils/web3Config';
import { ArrowPathIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const FTUSDTOperations: React.FC = () => {
  const { web3, account } = useWeb3Context();
  const [balance, setBalance] = useState('—');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchBalance = useCallback(async () => {
    if (!web3 || !account) return;
    try {
      setError('');
      const contract = await getFTUSDTContract(web3);
      const [rawBalance, decimals] = await Promise.all([
        contract.balanceOf(account).call(),
        contract.decimals().call()
      ]);
      const precision = Number(decimals);
      if (!Number.isInteger(precision) || precision < 0 || precision > 18) throw new Error('Token returned an unsupported decimal precision.');
      setBalance(fromSmallestUnit(rawBalance, precision));
    } catch (err: any) {
      setError(err?.message || 'Unable to read FTUSDT balance.');
    }
  }, [web3, account]);

  useEffect(() => { void fetchBalance(); }, [fetchBalance]);

  const handleTransfer = async () => {
    if (!web3 || !account) return;
    try {
      setLoading(true);
      setError('');
      setNotice('');
      if (!validateTronAddress(web3, transferTo)) throw new Error('Enter a valid TRON recipient address beginning with T.');
      const contract = await getFTUSDTContract(web3);
      const decimals = Number(await contract.decimals().call());
      const amount = toSmallestUnit(transferAmount, decimals);
      if (!window.confirm(`Send ${transferAmount} FTUSDT to ${transferTo}? Check the address carefully. This action cannot be reversed.`)) return;
      const result = await contract.transfer(transferTo, amount).send({
        feeLimit: 100000000,
        shouldPollResponse: true
      });
      setNotice(`Transfer submitted. Transaction: ${String(result)}`);
      setTransferAmount('');
      setTransferTo('');
      await fetchBalance();
    } catch (err: any) {
      setError(err?.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
        <h3 className="text-lg font-medium text-gray-900">Your FTUSDT Balance</h3>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-3xl font-bold text-indigo-600">{balance} FTUSDT</p>
          <button onClick={() => void fetchBalance()} disabled={!account} aria-label="Refresh balance" className="p-2 text-gray-500 disabled:opacity-40">
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        {!account && <p className="mt-2 text-sm text-gray-600">Connect a TRON wallet to read a balance.</p>}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Transfer FTUSDT</h3>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700" htmlFor="recipient">TRON recipient address</label>
          <input id="recipient" value={transferTo} onChange={e => setTransferTo(e.target.value)} placeholder="T…" className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          <label className="block text-sm font-medium text-gray-700" htmlFor="amount">Amount</label>
          <input id="amount" inputMode="decimal" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" className="w-full rounded-lg border border-gray-300 px-4 py-2" />
          <button onClick={() => void handleTransfer()} disabled={loading || !account || !transferAmount || !transferTo}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
            <PaperAirplaneIcon className="h-5 w-5" />{loading ? 'Processing…' : 'Transfer'}
          </button>
        </div>
      </div>
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 break-all">{notice}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 break-words">{error}</div>}
    </div>
  );
};

export default FTUSDTOperations;
