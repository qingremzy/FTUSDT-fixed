import React from 'react';

const CollateralManager: React.FC = () => (
  <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
    <h3 className="text-lg font-semibold text-amber-950">Collateral operations are paused</h3>
    <p className="text-sm leading-6 text-amber-900">
      The repository's collateral manager starts with its collateral token set to the zero address.
      The deployment flow does not configure a real collateral asset or its approvals. Enabling this
      screen before those settings are verified could send assets into a contract that cannot use them.
    </p>
    <p className="text-sm font-medium text-amber-900">
      No collateral approval or transfer will be requested from this screen.
    </p>
  </section>
);

export default CollateralManager;
