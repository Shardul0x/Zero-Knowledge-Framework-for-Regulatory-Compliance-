const { ethers } = require("hardhat");

async function main() {
  const [sender, recipient] = await ethers.getSigners();

  const mixer = await ethers.getContractAt(
    "ComplianceMixer",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );

  const secret = "hello123";
  const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes(secret));

  console.log("Withdrawing to:", recipient.address);
  const balanceBefore = await ethers.provider.getBalance(recipient.address);
  console.log("Balance before:", ethers.formatEther(balanceBefore), "ETH");

  const tx = await mixer.withdraw(nullifierHash, recipient.address);
  await tx.wait();
  console.log("Withdrawal successful! ✅");

  const balanceAfter = await ethers.provider.getBalance(recipient.address);
  console.log("Balance after:", ethers.formatEther(balanceAfter), "ETH");
  console.log("Received:", ethers.formatEther(balanceAfter - balanceBefore), "ETH");
}

main();