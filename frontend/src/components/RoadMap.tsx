'use client';

const phases = [
  { name: '1. Source-code review', status: 'In progress', description: 'Resolve implementation inconsistencies and document contract behavior before enabling user-facing transactions.' },
  { name: '2. Automated build checks', status: 'Added', description: 'Compile Solidity contracts and run frontend TypeScript and production-build checks in GitHub Actions.' },
  { name: '3. Testnet validation', status: 'Not started', description: 'After review, validate deployment, wallet connection, token accounting, collateral flows, and failure cases using test tokens only.' },
  { name: '4. Independent security audit', status: 'Not started', description: 'Commission an independent review of token economics, oracle design, governance, insurance, and all contract entry points.' },
  { name: '5. Release decision', status: 'Blocked', description: 'A mainnet release requires completed tests, resolved audit findings, verified deployment artifacts, and a separate approval process.' },
];

export default function RoadMap() {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-24 sm:py-32" id="roadmap">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Development roadmap</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Release gates, not launch promises</p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            No launch date, audit completion, exchange listing, or mainnet release is being claimed.
          </p>
        </div>
        <ol className="mx-auto mt-16 max-w-3xl space-y-6">
          {phases.map((phase) => (
            <li key={phase.name} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{phase.name}</h3>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{phase.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">{phase.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
