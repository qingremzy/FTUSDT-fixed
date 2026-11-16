# FTUSDT — Experimental TRON Collateral Protocol

> **Experimental software. Not Tether, not official USDT, and not a guaranteed $1 stablecoin.**
> Nile testnet only. Do not use real funds or present this as a production stablecoin.

FTUSDT is an experimental TRC-20-style token and collateral protocol for the TRON Virtual Machine (TVM). It includes collateral-backed minting, collateralized loans, liquidations, flash loans, insurance coverage, governance controls, and oracle components.

## Verified status

- Target network: **TRON Nile testnet only**.
- Last verified GitHub CI baseline: **Solidity compilation successful and 13 automated tests passing**.
- The optimizer was reduced to 1 run and both compile/test workflows passed again. The compiler still reports approximately 42 KB runtime code for FTUSDT.
- That 24,576-byte warning is Solidity's standard EVM/EIP-170 warning. It is **not, by itself, proof that Nile TVM rejects this contract**. Actual TVM deployment must be tested. Deployment Energy and transaction-size limits still need to be measured on Nile.
- **Nile deployment has not yet been completed.** The project must not be described as deployed or live on-chain.
- Mainnet deployment: **not approved**.
- Security audit: **not completed**.
- Latest CI dependency audit: **0 critical, 5 high, 3 moderate, and 13 low findings**. The report is retained as a GitHub Actions artifact. These findings must be reviewed and remediated before any mainnet use.
- Live external price feeds: **not integrated**. PriceOracle is owner-controlled and deployment uses test collateral.
- Governance voting power is currently assigned by the contract owner. It is not yet a decentralized, token-balance snapshot system.
- The dashboard and contract deployment are separate. A live website does not mean the token has been deployed.

## Contract components

Located in `backend/smartcontracts/`:

- `FTUSDT.sol` — token, collateral minting, loans, liquidation, and flash-loan logic.
- `CollateralManager.sol` — collateral custody and transfer controls.
- `InsurancePool.sol` — premiums, reserved coverage, claim review, and payouts.
- `Governance.sol` — parameter proposals, voting, and delayed execution.
- `PriceOracle.sol` — owner-managed test price source.
- `MultiOracle.sol` — weighted reporter aggregation with freshness and divergence checks.
- `MockCollateral.sol` — test-only collateral token, not a real-world asset.
- `MockFlashLoanReceiver.sol` — test helper only.

## Run checks locally

Use Node.js 24 or newer.

```bash
cd backend
npm install
npm run compile
npm test
```

Hardhat tests run in a local EVM environment. They do not prove that every operation behaves identically on TRON TVM.

## Nile deployment through GitHub Actions

A manual deployment workflow is provided at **Actions → Deploy FTUSDT to Nile Testnet → Run workflow**.

Before running it:

1. Create a dedicated wallet for Nile testnet only. Never use a wallet holding real assets.
2. Fund that wallet with Nile test TRX for deployment and Energy.
3. In the GitHub repository, open **Settings → Environments** and create an environment named `nile-testnet`.
4. Add an environment secret named `NILE_PRIVATE_KEY` containing that testnet wallet's private key. Never paste the key into chat, commit it, or put it in workflow inputs.
5. Run the workflow with the default mock collateral supply and zero initial FTUSDT supply.

The workflow recompiles the contracts, runs the tests, syntax-checks the deployment scripts, and only then attempts deployment. After deployment it runs `npm run verify:testnet`, which checks that all six addresses contain deployed bytecode, ownership and cross-contract wiring are correct, token metadata and initial supplies match, and both test oracle prices are initialized. A successful run uploads `ftusdt-nile-deployment` as a 90-day Actions artifact containing `deployment-nile.json`. The contract addresses are also printed in the Actions log. If deployment or verification fails, use the actual error and Nile transaction evidence to diagnose it. Do not assume a successful compile means deployment succeeded.

A local deployment is also available from `backend/` after setting `PRIVATE_KEY` in an untracked local `.env` file:

```bash
npm run deploy:testnet
```

The deployment script rejects networks other than Nile.

## Before any real launch

A mainnet launch requires independent security audits and remediation, production-grade oracle feeds, decentralized snapshot-safe governance, a complete accounting review, verified TVM deployment and Energy-cost measurements, and legal/compliance review. Passing compilation or local tests is not a security audit.

## License

MIT
