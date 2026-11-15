# FTUSDT repository review fork

This fork is a local review and test copy of the upstream FTUSDT repository. It is not the upstream owner's live website or deployed contract.

## Current frontend baseline

- The frontend wallet adapter now targets the TRON provider injected as `window.tron`, not an EVM `window.ethereum` provider.
- Wallet authorization is requested only after the user presses Connect.
- Token balances and transfers use the contract's declared decimal precision. The source contract declares 6 decimals.
- The frontend ABI contains only the TRC-20 methods confirmed in the checked-in Solidity source.
- Collateral and flash-transaction write screens are intentionally paused because the checked-in deployment and contract interfaces do not support the previous frontend calls safely.

## Important blockers before real contract use

The checked-in source is not yet a verified, deployable, production-ready system:

1. `FTUSDT.sol` requires five constructor arguments, but both deployment scripts supply only three.
2. The custom deployment script deploys neither Governance nor InsurancePool, although the FTUSDT constructor requires both addresses.
3. The frontend has no confirmed deployed FTUSDT contract address. Configure `NEXT_PUBLIC_FTUSDT_ADDRESS` only after independently verifying the address and bytecode on the intended TRON network.
4. `CollateralManager.sol` initializes its collateral token to the zero address. A reviewed deployment and collateral-token configuration are required before collateral operations can be enabled.
5. The contract's flash-transaction mapping is private and has no public getter; the previous frontend also called a cancellation method that is absent from the contract.
6. The Solidity source and deployment artifacts still need a full compiler, unit-test, and security review. A frontend build alone cannot establish contract safety.

## Local frontend

From `frontend`:

```bash
npm install
npm run build
npm run dev
```

Use a dedicated test wallet and the intended test network. Never enter a seed phrase or private key into this website, repository, or chat. Do not approve spending or transfer assets until the deployed contract, source verification, and security review have been independently confirmed.
