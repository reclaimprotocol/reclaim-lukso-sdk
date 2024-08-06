# LUKSO SDK

## Deployments

| Contract Name | Deployed Address                           | Explorer Link                                                                                       |
| :------------ | :----------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| Reclaim       | 0x88cEd91D4966D82912774B9fdf9ca4E065881a91 | https://explorer.execution.testnet.lukso.network/address/0x88cEd91D4966D82912774B9fdf9ca4E065881a91 |
| ProofStorage  | 0x0E2CF8810B11c2875246d634f030897e77491680 | https://explorer.execution.testnet.lukso.network/address/0x0E2CF8810B11c2875246d634f030897e77491680 |

## Setup

Install dependencies:

```
npm install --legacy-peer-deps
```

In node directory, populate your .env:

```
PRIVATE_KEY=your-private-key-here
```

## Commands

Run Tests:

```
npm run test
```

Deploy Contracts on Testnet:

```
npx hardhat run scripts/deploy.ts --network luksoTestnet
```
