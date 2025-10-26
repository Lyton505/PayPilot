import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const PaymentPolicyModule = await ethers.getContractFactory("PaymentPolicyModule");
  const paymentPolicy = await PaymentPolicyModule.deploy(deployer.address);

  await paymentPolicy.waitForDeployment();

  const contractAddress = await paymentPolicy.getAddress();
  console.log("PaymentPolicyModule deployed to:", contractAddress);

  // Verify deployment
  const owner = await paymentPolicy.owner();
  const defaultCap = await paymentPolicy.defaultSpendingCap();
  const isAdmin = await paymentPolicy.isAdmin(deployer.address);

  console.log("Contract owner:", owner);
  console.log("Default spending cap:", ethers.formatUnits(defaultCap, 6), "PYUSD");
  console.log("Deployer is admin:", isAdmin);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});