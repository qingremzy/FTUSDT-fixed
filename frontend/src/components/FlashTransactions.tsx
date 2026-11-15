import React from 'react';

const FlashTransactions: React.FC = () => (
  <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
    <h3 className="text-lg font-semibold text-amber-950">Flash transactions are paused</h3>
    <p className="text-sm leading-6 text-amber-900">
      The current contract exposes no public getter for its private flash-transaction mapping and
      no cancellation method, although the previous frontend called both. The transaction form
      cannot be used reliably until a reviewed contract ABI and matching deployed contract are available.
    </p>
    <p className="text-sm font-medium text-amber-900">
      This screen is read-only. It will not create, approve, execute, or cancel transactions.
    </p>
  </section>
);

export default FlashTransactions;
