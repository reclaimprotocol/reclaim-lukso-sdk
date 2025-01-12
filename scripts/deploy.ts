import { ethers } from "hardhat";

async function main() {
  // Deploy Reclaim contract with ProofStorage address
  const Reclaim = await ethers.getContractFactory("Reclaim");
  const reclaim = await Reclaim.deploy();
  await reclaim.deployed();
  console.log("Reclaim deployed to:", reclaim.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
