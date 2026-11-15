'use client';

export default function Hero() {
  return (
    <section className="relative isolate px-6 pt-14 lg:px-8">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
        />
      </div>
      <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">TRON token project · In development</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Flash USDT (FTUSDT)
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            An experimental TRC-20 token and collateral-system codebase under development.
            The contracts have not been independently audited or verified as a live stablecoin.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="#token-info" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
              View project details
            </a>
            <a href="#roadmap" className="text-sm font-semibold leading-6 text-gray-900">
              Development status <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center"><p className="text-3xl font-bold text-gray-900">6</p><p className="text-sm text-gray-500">Source decimals</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-gray-900">TRC-20</p><p className="text-sm text-gray-500">Target standard</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-gray-900">Not verified</p><p className="text-sm text-gray-500">Live deployment</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
