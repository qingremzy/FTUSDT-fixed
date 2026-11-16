# FTUSDT — Experimental TRON Collateral Protocol

> **Experimental software. Not Tether, not official USDT, and not a guaranteed $1 stablecoin.**
> This repository is under active development. Do not use it for real funds or deploy it to mainnet.

FTUSDT is an experimental TRC-20-style token and collateral protocol being developed for the TRON Virtual Machine (TVM). The project includes collateral-backed minting, collateralized loans, liquidations, flash loans, insurance coverage, governance controls, and price-oracle components.

## Important status

- Target network: **TRON Nile testnet only**.
- Mainnet deployment: **not approved**.
- Security audit: **not completed**.
- Live external price feeds: **not integrated**. The current PriceOracle is owner-controlled and the deployment script uses test collateral.
- Governance voting power: **currently assigned by the contract owner**. It is not yet a decentralized, token-balance snapshot system.
- The dashboard and contract deployment are separate. A website being online does not mean the token has been deployed.
- Wallet support and testnet token-import behavior are not guaranteed.

## Current contract components

Located in backend/smartcontracts/:

- FTUSDT.sol — token, collateral minting, loans, liquidation, and flash-loan logic.
- CollateralManager.sol — custody and transfer controls for collateral.
- InsurancePool.sol — premium collection, coverage reservations, claim review, and payouts.
- Governance.sol — parameter proposals, voting, and delayed execution.
- PriceOracle.sol — owner-managed test price source.
- MultiOracle.sol — weighted reporter aggregation with freshness and price-divergence checks.
- MockCollateral.sol — test-only collateral token. It is not a real-world asset.
- MockFlashLoanReceiver.sol — test helper only.

## Run the checks

Use Node.js 20 or a compatible version.

```bash
cd backend
npm install
npm run compile
npm test
```

The Hardhat tests run in a local EVM environment. They are useful for checking contract logic, but they do **not** prove that every operation behaves identically on the TRON TVM.

## Nile testnet deployment

Only attempt this after reviewing the deployment script and confirming that the contracts are ready for a testnet trial.

1. From backend/, copy .env.example to .env.
2. Set a dedicated Nile testnet deployer private key in the local .env file.
3. Fund that testnet account with test TRX for Energy and deployment fees.
4. Run:

```bash
npm run deploy:testnet
```

Never commit .env, share a private key, or use a wallet that holds real assets. The deployment script is intentionally restricted to Nile.

## Before any real launch

The project still requires, at minimum:

- a complete end-to-end test suite on Nile itself;
- a reviewed deployment and upgrade/recovery plan;
- production-grade, independently verified oracle feeds;
- decentralized and snapshot-safe governance;
- a full accounting review of collateral, debt, interest, liquidation, and insurance liabilities;
- bytecode-size and Energy-cost validation on the target TVM;
- independent smart-contract security audits and remediation;
- clear legal, compliance, and risk disclosures.

Passing compilation or local tests is not a security audit and does not mean the protocol is ready for mainnet.

## License

MIT
