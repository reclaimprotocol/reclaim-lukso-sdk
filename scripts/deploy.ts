import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy ProofStorage contract
  const ProofStorage = await ethers.getContractFactory("ProofStorage");
  const proofStorage = await ProofStorage.deploy(deployer.address);
  await proofStorage.deployed();
  console.log("ProofStorage deployed to:", proofStorage.address);

  // Deploy Reclaim contract with ProofStorage address
  const Reclaim = await ethers.getContractFactory("Reclaim");
  const reclaim = await Reclaim.deploy(proofStorage.address);
  await reclaim.deployed();
  console.log("Reclaim deployed to:", reclaim.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
