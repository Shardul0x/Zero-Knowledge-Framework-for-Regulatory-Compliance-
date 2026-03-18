const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComplianceMixer", function () {
  let mixer;
  let owner;
  let recipient;

  beforeEach(async function () {
    [owner, recipient] = await ethers.getSigners();
    const Mixer = await ethers.getContractFactory("ComplianceMixer");
    mixer = await Mixer.deploy();
    await mixer.waitForDeployment();
  });

  it("should accept a deposit", async function () {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("mysecret"));
    await mixer.deposit(commitment, { value: ethers.parseEther("0.1") });
    expect(await mixer.commitments(commitment)).to.equal(true);
    console.log("Deposit works!");
  });

  it("should reject wrong deposit amount", async function () {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("mysecret"));
    await expect(
      mixer.deposit(commitment, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWith("Wrong amount");
    console.log("Wrong amount rejected!");
  });

  it("should reject duplicate deposit", async function () {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("mysecret"));
    await mixer.deposit(commitment, { value: ethers.parseEther("0.1") });
    await expect(
      mixer.deposit(commitment, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Already deposited");
    console.log("Duplicate rejected!");
  });
});