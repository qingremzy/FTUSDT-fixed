'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWeb3Context } from '../context/Web3Context';

const Navbar = () => {
  const pathname = usePathname();
  const { account, connect, loading, error } = useWeb3Context();
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Loans', href: '/dashboard/loans' },
    { name: 'Flash Loans', href: '/dashboard/flash-loans' },
    { name: 'Collateral', href: '/dashboard/collateral' },
    { name: 'Insurance', href: '/dashboard/insurance' },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-16 py-3 gap-4">
          <Link href="/" className="flex items-center shrink-0">
            <span className="text-xl font-bold">FTUSDT</span>
            <span className="ml-2 text-sm text-blue-300">TRON</span>
          </Link>
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === item.href ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-blue-800 hover:text-white'}`}>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-col items-end gap-1">
            {account ? (
              <span className="rounded-md bg-blue-800 px-3 py-2 text-xs font-mono">{account.slice(0, 7)}…{account.slice(-5)}</span>
            ) : (
              <button onClick={() => void connect().catch(() => undefined)} disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Connecting…' : 'Connect TRON Wallet'}
              </button>
            )}
            {error && <span className="max-w-56 text-right text-xs text-red-200">{error}</span>}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
