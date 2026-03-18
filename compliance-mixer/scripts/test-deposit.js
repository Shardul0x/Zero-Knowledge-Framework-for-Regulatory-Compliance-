const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH");

  const mixer = await ethers.getContractAt(
    "ComplianceMixer",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );

  const secret = "hello123";
  const commitment = ethers.keccak256(ethers.toUtf8Bytes(secret));
  console.log("Depositing with commitment:", commitment);

  const tx = await mixer.deposit(commitment, {
    value: ethers.parseEther("0.1"),
  });
  await tx.wait();
  console.log("Deposit successful! ✅");

  const exists = await mixer.commitments(commitment);
  console.log("Commitment stored on-chain:", exists);
}

main();