import { task, types } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { Reclaim } from "../src/types";

task("add-new-epoch", "Start a new epoch")
  .addParam("address", "address of a witness", undefined, types.string)
  .addParam("host", "Hostof a witness", undefined, types.string)
  .setAction(async (taskArgs, { ethers, network }) => {
    const { address, host } = taskArgs;
    if (!address) {
      console.log("here");
      return;
    }

    const witness: Reclaim.WitnessStruct = { addr: address, host };
    const signerAddress = await ethers.provider.getSigner().getAddress();
    console.log(
      `adding witness on "${network.name}" from address "${signerAddress}"`
    );

    const contractAddress = "0x94521c2e16EF1F2682b59918E3b20459fDF48756"; //Replace with your Contract address
    const factory = await ethers.getContractFactory("Reclaim");
    const contract = factory.attach(contractAddress);

    const tx = await contract.addNewEpoch([witness], 1);
    await tx.wait();
    // console.log(tx);
    // return; //
    const currentEpoch = await contract.fetchEpoch(0);

    console.log(`current epoch: ${currentEpoch.id}`);
    console.log(
      `epoch witnesses: ${currentEpoch.witnesses.map((w) => w.addr).join(", ")}`
    );
    console.log(`epoch start: ${new Date(currentEpoch.timestampStart * 1000)}`);
  });
