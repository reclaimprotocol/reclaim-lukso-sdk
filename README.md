# LUKSO SDK

## Deployments

| Contract Name | Deployed Address                           | Explorer Link                                                                                       |
| :------------ | :----------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| Reclaim       | 0x93a9d327836A5279E835EF3147ac1fb54FBd726B | https://explorer.execution.testnet.lukso.network/address/0x93a9d327836A5279E835EF3147ac1fb54FBd726B |
| ProofStorage  | 0x9bfAccAF7E28828d6ba4CE6135a552DB6429ff7C | https://explorer.execution.testnet.lukso.network/address/0x9bfAccAF7E28828d6ba4CE6135a552DB6429ff7C |

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
