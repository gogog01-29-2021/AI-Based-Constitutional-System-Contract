const hre = require("hardhat");

async function main() {
  // Get the ContractFactory for TransparentExecutionEngine
  const TransparentExecutionEngine = await hre.ethers.getContractFactory("TransparentExecutionEngine");

  // Deploy the contract.
  // We need to provide an address for `_constitutionalLLMOracle` in the constructor.
  // For now, let's use the first signer's address as a placeholder.
  // In a real scenario, this would be the actual address of an oracle contract/service.
  const [deployer] = await hre.ethers.getSigners();
  const constitutionalLLMOracleAddress = deployer.address; // Using deployer as placeholder

  console.log(`Deploying TransparentExecutionEngine with LLM Oracle address: ${constitutionalLLMOracleAddress}`);

  const transparentExecutionEngine = await TransparentExecutionEngine.deploy(constitutionalLLMOracleAddress);

  // Wait for the contract to be deployed
  await transparentExecutionEngine.waitForDeployment();

  console.log(
    `TransparentExecutionEngine deployed to: ${transparentExecutionEngine.target}`
  );

  // You can save the contract address and ABI for frontend integration
  // For example, by writing to a file:
  // const fs = require('fs');
  // const contractAddress = transparentExecutionEngine.target;
  // const contractABI = transparentExecutionEngine.interface.format(ethers.FormatTypes.json);
  // fs.writeFileSync('./client/src/contractAddress.json', JSON.stringify({ address: contractAddress }));
  // fs.writeFileSync('./client/src/contractABI.json', JSON.stringify(contractABI));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
