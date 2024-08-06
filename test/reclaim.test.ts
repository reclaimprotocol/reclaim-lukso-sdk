import {
  CompleteClaimData,
  createSignDataForClaim,
  fetchWitnessListForClaim,
  hashClaimInfo,
} from "@reclaimprotocol/crypto-sdk";

import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { Reclaim } from "../src/types";
import {
  deployReclaimContract,
  generateMockWitnessesList,
  randomEthAddress,
  randomWallet,
  randomiseWitnessList,
  deployProofStorageContract,
} from "./utils";
import { ethers, run, upgrades } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { randomBytes } from "crypto";

import { deployFixture, proofsFixture } from "./fixtures";

describe("Reclaim Tests", () => {
  const NUM_WITNESSES = 5;
  const MOCK_HOST_PREFIX = "localhost:555";

  it("should fail to execute admin functions if not owner", async () => {
    let { contract, witnesses } = await loadFixture(deployFixture);
    const NOT_OWNER_MSG = "Ownable: caller is not the owner";
    const user = await randomWallet(1, ethers.provider);
    contract = await contract.connect(user);

    const expectedRejections = [() => contract.addNewEpoch(witnesses, 5)];
    for (const reject of expectedRejections) {
      expect(reject()).to.be.revertedWith(NOT_OWNER_MSG);
    }
  });

  it("should insert some epochs", async () => {
    let { contract, witnesses, owner } = await loadFixture(deployFixture);
    const currentEpoch = await contract.currentEpoch();
    for (let i = 1; i < 5; i++) {
      const tx = await contract.addNewEpoch(witnesses, 5);
      await tx.wait();
      // current epoch
      const epoch = await contract.fetchEpoch(0);
      expect(epoch.id).to.be.eq(currentEpoch + i);
      expect(epoch.witnesses).to.have.length(NUM_WITNESSES);
      expect(epoch.timestampStart).to.be.gt(0);

      const epochById = await contract.fetchEpoch(epoch.id);
      expect(epochById.id).to.be.eq(epoch.id);
    }
  });

  describe("Proofs tests", async () => {
    it("should verify a claim", async () => {
      let { contract, user, superProofs } = await loadFixture(proofsFixture);
      await contract.connect(user).verifyProof(superProofs[1]);
    });
  });
});

describe("Reclaim Witness Fetch Tests", () => {
  const NUM_WITNESSES = 15;
  const MOCK_HOST_PREFIX = "localhost:555";
  let contract: Reclaim;
  let witnesses: Reclaim.WitnessStruct[] = [];

  beforeEach(async () => {
    let proofContract: any = await deployProofStorageContract(ethers);
    contract = await deployReclaimContract(ethers, proofContract.address);
    let { mockWitnesses } = await generateMockWitnessesList(
      NUM_WITNESSES,
      MOCK_HOST_PREFIX,
      ethers
    );
    witnesses = await randomiseWitnessList(mockWitnesses);
  });

  // check TS & solidity implementations match
  it("match fetchWitnessList implementation for claim", async () => {
    await contract.addNewEpoch(witnesses, 5);
    const currentEpoch = await contract.fetchEpoch(0);

    const identifier = hashClaimInfo({
      parameters: "1234",
      provider: "test",
      context: "test",
    });

    const timestampS = Math.floor(Date.now() / 1000);

    const witnessesTs = await fetchWitnessListForClaim(
      {
        epoch: currentEpoch.id,
        witnesses: currentEpoch.witnesses.map((w) => ({
          id: w.addr,
          url: w.host,
        })),
        witnessesRequiredForClaim:
          currentEpoch.minimumWitnessesForClaimCreation,
        nextEpochTimestampS: 0,
      },
      identifier,
      timestampS
    );

    const witnessesContract = await contract.fetchWitnessesForClaim(
      currentEpoch.id,
      identifier,
      timestampS
    );

    const witnessesContractHosts = witnessesContract.length;
    for (let i = 0; i < witnessesContractHosts; i++) {
      expect(witnessesContract[i].host.toLowerCase()).to.equal(
        witnessesTs[i].url.toLowerCase()
      );
    }
  });
});

describe("Reclaim VerifyProof Tests", () => {
  describe("Proof Verification", async () => {
    it("should verify a valid proof", async () => {
      const { contract, user, superProofs } = await loadFixture(proofsFixture);
      await contract.connect(user).verifyProof(superProofs[1]);
    });

    it("should fail with no signatures error", async () => {
      const { contract, superProofs } = await loadFixture(proofsFixture);
      const proof = {
        ...superProofs[1],
        signedClaim: { ...superProofs[1].signedClaim, signatures: [] },
      };
      await expect(contract.verifyProof(proof)).to.be.revertedWith(
        "No signatures"
      );
    });

    it("should fail with number of signatures not equal to number of witnesses error", async () => {
      const { contract, superProofs } = await loadFixture(proofsFixture);
      const proof = { ...superProofs[1] };
      proof.signedClaim.signatures.pop(); // Remove one signature to create the error
      await expect(contract.verifyProof(proof)).to.be.revertedWith(
        "Number of signatures not equal to number of witnesses"
      );
    });

    it("should fail with duplicated signatures error", async () => {
      const { contract, superProofs } = await loadFixture(proofsFixture);
      const proof = { ...superProofs[1] };
      proof.signedClaim.signatures.push(proof.signedClaim.signatures[0]); // Duplicate a signature
      await expect(contract.verifyProof(proof)).to.be.revertedWith(
        "Duplicated Signatures Found"
      );
    });

    it("should verify proof with appropriate signatures and witnesses", async () => {
      const { contract, owner } = await loadFixture(deployFixture);
      const witnesses = [
        {
          addr: "0x244897572368eadf65bfbc5aec98d8e5443a9072",
          host: "https://reclaim-node.questbook.app",
        },
      ];
      await contract.addNewEpoch(witnesses, 1);
      const epoch = await contract.fetchEpoch(1);

      const proof = {
        claimInfo: {
          context:
            '{"contextAddress":"0x0","contextMessage":"0098967F","providerHash":"0xeda3e4cee88b5cbaec045410a0042f99ab3733a4d5b5eb2da5cecc25aa9e9df1"}',
          provider: "http",
          parameters:
            '{"body":"","geoLocation":"in","method":"GET","responseMatches":[{"type":"contains","value":"_steamid\\">Steam ID: 76561198155115943</div>"}],"responseRedactions":[{"jsonPath":"","regex":"_steamid\\">Steam ID: (.*)</div>","xPath":"id(\\"responsive_page_template_content\\")/div[@class=\\"page_header_ctn\\"]/div[@class=\\"page_content\\"]/div[@class=\\"youraccount_steamid\\"]"}],"url":"https://store.steampowered.com/account/"}',
        },
        signedClaim: {
          claim: {
            epoch: epoch.id,
            identifier:
              "0x930a5687ac463eb8f048bd203659bd8f73119c534969258e5a7c5b8eb0987b16",
            owner: "0xef27fa8830a070aa6e26703be6f17858b61d3fba",
            timestampS: 1712685785,
          },
          signatures: [
            "0xb246a05693f3e21a70eab5dfd5edc1d0597a160c82b8bf9e24d1f09f9dde9899154bb1672c1bf38193a7829e96e4ed09bc327657bf266e90451f6a90c8b45dfb1c",
          ],
        },
      };

      await expect(contract.verifyProof(proof)).to.not.be.reverted;
    });
  });
});

describe("Get Proof Data", () => {
  it("should store and retrieve a proof correctly", async function () {
    let proofContract: any = await deployProofStorageContract(ethers);
    let [owner, addr1] = await ethers.getSigners();

    const claimIdentifier =
      "0x930a5687ac463eb8f048bd203659bd8f73119c534969258e5a7c5b8eb0987b16";

    const data = {
      claimInfo: {
        context:
          '{"contextAddress":"0x0","contextMessage":"0098967F","providerHash":"0xeda3e4cee88b5cbaec045410a0042f99ab3733a4d5b5eb2da5cecc25aa9e9df1"}',
        provider: "http",
        parameters:
          '{"body":"","geoLocation":"in","method":"GET","responseMatches":[{"type":"contains","value":"_steamid\\">Steam ID: 76561198155115943</div>"}],"responseRedactions":[{"jsonPath":"","regex":"_steamid\\">Steam ID: (.*)</div>","xPath":"id(\\"responsive_page_template_content\\")/div[@class=\\"page_header_ctn\\"]/div[@class=\\"page_content\\"]/div[@class=\\"youraccount_steamid\\"]"}],"url":"https://store.steampowered.com/account/"}',
      },
      signedClaim: {
        claim: {
          epoch: 1,
          identifier: claimIdentifier,
          owner: "0xef27fa8830a070aa6e26703be6f17858b61d3fba",
          timestampS: 1712685785,
        },
        signatures: [
          "0xb246a05693f3e21a70eab5dfd5edc1d0597a160c82b8bf9e24d1f09f9dde9899154bb1672c1bf38193a7829e96e4ed09bc327657bf266e90451f6a90c8b45dfb1c",
        ],
      },
    };

    // Encode the data to bytes
    const encodedData = ethers.utils.defaultAbiCoder.encode(
      [
        "tuple(tuple(string context, string provider, string parameters) claimInfo, tuple(tuple(uint256 epoch, bytes32 identifier, address owner, uint256 timestampS) claim, bytes[] signatures) signedClaim)",
      ],
      [data]
    );

    // Store the proof
    await proofContract.connect(addr1).storeProof(claimIdentifier, encodedData);

    // Retrieve the proof
    const proof = await proofContract.getProof(claimIdentifier);
    // Decode the retrieved data
    const decodedData = ethers.utils.defaultAbiCoder.decode(
      [
        "tuple(tuple(string context, string provider, string parameters) claimInfo, tuple(tuple(uint256 epoch, bytes32 identifier, address owner, uint256 timestampS) claim, bytes[] signatures) signedClaim)",
      ],
      proof.data
    );

    // Check if the stored proof matches the retrieved proof
    expect(proof.claimIdentifier).to.equal(claimIdentifier);
    expect(decodedData[0].claimInfo.context).to.equal(data.claimInfo.context);
    expect(decodedData[0].claimInfo.provider).to.equal(data.claimInfo.provider);
    expect(decodedData[0].claimInfo.parameters).to.equal(
      data.claimInfo.parameters
    );
    expect(decodedData[0].signedClaim.claim.epoch).to.equal(
      data.signedClaim.claim.epoch
    );
    expect(decodedData[0].signedClaim.claim.identifier).to.equal(
      data.signedClaim.claim.identifier
    );
    expect(decodedData[0].signedClaim.claim.owner.toLowerCase()).to.equal(
      data.signedClaim.claim.owner.toLowerCase()
    );
    expect(decodedData[0].signedClaim.claim.timestampS).to.equal(
      data.signedClaim.claim.timestampS
    );
    expect(decodedData[0].signedClaim.signatures[0]).to.equal(
      data.signedClaim.signatures[0]
    );
  });
});
