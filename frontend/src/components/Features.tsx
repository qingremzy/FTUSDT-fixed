'use client';

import { CurrencyDollarIcon, ShieldCheckIcon, BoltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const features = [
  { name: 'TRC-20 target', description: 'The token contract is written for the TRC-20 interface on the TRON network.', icon: ShieldCheckIcon },
  { name: 'Wallet connectivity', description: 'TRON wallet discovery and account connection are being developed for the web interface.', icon: BoltIcon },
  { name: 'Security review pending', description: 'The smart contracts have not completed independent security auditing or comprehensive functional testing.', icon: CurrencyDollarIcon },
  { name: 'Development build', description: 'Collateral and flash-transaction screens remain paused until their contract flows are reviewed and verified.', icon: ArrowPathIcon },
];

export default function Features() {
  return (
    <section className="bg-white py-24 sm:py-32" id="features">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Project scope</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">What is currently in development</p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            This page describes development work only. It does not represent a live, audited, or market-ready stablecoin.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-4xl">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
            {features.map(feature => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
