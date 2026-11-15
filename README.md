# FTUSDT development fork

This repository is a development and review fork of the upstream FTUSDT codebase. It is not the upstream owner's live website or a verified deployed token.

## Current source configuration

- Token name: Flash USDT
- Token symbol: FTUSDT
- Token decimals: **6** (1 FTUSDT = 1,000,000 base units)
- Target chain: TRON, with Nile testnet as the development network
- Initial supply is supplied as a whole-token integer and scaled by 10^6 in the constructor.
- The frontend reads a contract address only from `NEXT_PUBLIC_FTUSDT_ADDRESS`.
- Wallet connection uses the injected TRON provider. Connecting a wallet does not require or reveal a private key or seed phrase.

## Current safety state

- Mainnet deployment is deliberately blocked in the custom deployment script and the TronBox network configuration.
- Frontend token transfers are disabled unless explicitly enabled for a verified Nile testnet deployment.
- Collateral and flash-transaction screens are read-only/paused pending matching reviewed contract interfaces and configuration.
- The frontend does not claim a live token price, circulating supply, holder count, market capitalization, trading volume, exchange listing, commercial partnership, or completed security audit.
- A static owner-controlled price oracle is included for development only. It is not a production price feed.
- Governance voting power is assigned by the contract owner. It is not permissionless or token-balance-based governance.
- The contracts have not undergone an independent security audit or comprehensive functional testing. Successful compilation is not evidence of safety.

## Local build checks

Backend:
```bash
cd backend
npm install
npx tronbox compile
```

Frontend:
```bash
cd frontend
npm ci
npx tsc --noEmit
npm run build
```

## Deployment restrictions

Do not deploy to mainnet or use real funds from this development fork. Testnet deployment also requires a dedicated test wallet, review of all constructor arguments, collateral-token configuration, contract bytecode, and deployment output.

Never put a private key or seed phrase in chat, source control, frontend environment variables, or a public file. Keep secrets only in local backend secret storage.

Before any live release, the protocol needs a full independent review of token economics, collateral accounting, liquidation, loan repayment, flash loans, governance, insurance liabilities, oracle design, deployment scripts, and frontend-to-contract ABI consistency. It also needs a complete test suite and independent security audit.
