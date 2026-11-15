'use client';

const stats = [
  { name: 'Token name', value: 'Flash USDT' },
  { name: 'Token symbol', value: 'FTUSDT' },
  { name: 'Token decimals', value: '6' },
  { name: 'Deployment status', value: 'Not verified' },
];

export default function TokenStats() {
  return (
    <section className="bg-white py-24 sm:py-32" id="token-info">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Token information</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            FTUSDT development details
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            These are source-code details, not live market data. No verified mainnet contract,
            circulating supply, market price, holder count, or trading volume is claimed here.
          </p>
        </div>
        <dl className="mt-16 grid grid-cols-1 gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="rounded-2xl bg-gray-50 p-8">
              <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
