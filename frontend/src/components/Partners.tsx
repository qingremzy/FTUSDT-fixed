'use client';

const integrations = [
  { name: 'TRON network', description: 'Target blockchain', status: 'Target platform' },
  { name: 'TronLink', description: 'Wallet provider interface', status: 'Integration under development' },
];

export default function Partners() {
  return (
    <section className="bg-gray-50 py-24 sm:py-32" id="partners">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Technical integrations</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Current integration targets</p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            These are technologies the project is built to work with, not commercial partners,
            endorsements, audits, or confirmed exchange listings.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
          {integrations.map(item => (
            <div key={item.name} className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{item.description}</p>
              <p className="mt-4 text-xs font-medium text-indigo-600">{item.status}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
