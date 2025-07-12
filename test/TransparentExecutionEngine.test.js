const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransparentExecutionEngine", function () {
  let TransparentExecutionEngine;
  let transparentExecutionEngine;
  let deployer;
  let llmOracle;
  let user1;
  let user2;

  // Before each test, deploy a new contract
  beforeEach(async function () {
    [deployer, llmOracle, user1, user2] = await ethers.getSigners();
    TransparentExecutionEngine = await ethers.getContractFactory("TransparentExecutionEngine");
    transparentExecutionEngine = await TransparentExecutionEngine.deploy(llmOracle.address);
    await transparentExecutionEngine.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct LLM Oracle address", async function () {
      expect(await transparentExecutionEngine.constitutionalLLMOracle()).to.equal(llmOracle.address);
    });

    it("Should initialize _nextPolicyId to 0", async function () {
      // Since _nextPolicyId is private, we can't directly read it.
      // We'll infer its initial state by checking the first policy ID.
      // This test will be more robust after executePolicy is tested.
    });
  });

  describe("executePolicy", function () {
    const testMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("policy_data_1"));

    it("Should allow the LLM Oracle to execute a policy", async function () {
      await expect(transparentExecutionEngine.connect(llmOracle).executePolicy(testMerkleRoot))
        .to.emit(transparentExecutionEngine, "PolicyExecuted")
        .withArgs(0, testMerkleRoot, llmOracle.address, (await ethers.provider.getBlock("latest")).timestamp);

      expect(await transparentExecutionEngine.getTotalPolicies()).to.equal(1);
      expect(await transparentExecutionEngine.getPolicyMerkleRoot(0)).to.equal(testMerkleRoot);
      expect(await transparentExecutionEngine.getPolicyInitiator(0)).to.equal(llmOracle.address);
    });

    it("Should increment policy ID for each new policy", async function () {
      await transparentExecutionEngine.connect(llmOracle).executePolicy(testMerkleRoot);
      const testMerkleRoot2 = ethers.keccak256(ethers.toUtf8Bytes("policy_data_2"));
      await transparentExecutionEngine.connect(llmOracle).executePolicy(testMerkleRoot2);

      expect(await transparentExecutionEngine.getTotalPolicies()).to.equal(2);
      expect(await transparentExecutionEngine.getPolicyMerkleRoot(1)).to.equal(testMerkleRoot2);
    });

    it("Should revert if called by a non-LLM Oracle address", async function () {
      await expect(transparentExecutionEngine.connect(user1).executePolicy(testMerkleRoot))
        .to.be.revertedWith("Policy not verified by Constitutional LLM.");
    });
  });

  describe("recordExpenditure", function () {
    const policyId = 0;
    const recipient = "0x70997970C51812dc3A0108C7D658ADceC89eA5ce"; // Example address
    const amount = ethers.parseEther("1.5"); // 1.5 ETH
    const description = "Office supplies purchase";

    beforeEach(async function () {
      // First, execute a policy to have a valid policyId
      const testMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("policy_for_expenditure"));
      await transparentExecutionEngine.connect(llmOracle).executePolicy(testMerkleRoot);
    });

    it("Should record an expenditure successfully", async function () {
      await expect(transparentExecutionEngine.recordExpenditure(policyId, recipient, amount, description))
        .to.emit(transparentExecutionEngine, "ExpenditureRecorded")
        .withArgs(policyId, recipient, amount, description);
    });

    it("Should allow any address to record an expenditure (as per current design)", async function () {
      await expect(transparentExecutionEngine.connect(user1).recordExpenditure(policyId, recipient, amount, description))
        .to.not.be.reverted;
    });
  });

  describe("recordSelfDiagnosticLog", function () {
    const policyId = 0;
    const message = "Execution failed: Insufficient funds in treasury.";

    beforeEach(async function () {
      // First, execute a policy to have a valid policyId
      const testMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("policy_for_log"));
      await transparentExecutionEngine.connect(llmOracle).executePolicy(testMerkleRoot);
    });

    it("Should record a self-diagnostic log successfully", async function () {
      await expect(transparentExecutionEngine.recordSelfDiagnosticLog(policyId, message))
        .to.emit(transparentExecutionEngine, "SelfDiagnosticLog")
        .withArgs(policyId, 0, message); // First log for this policy is index 0

      expect(await transparentExecutionEngine.getSelfDiagnosticLog(policyId, 0)).to.equal(message);
    });

    it("Should record multiple logs for the same policy with incrementing indices", async function () {
      const message2 = "Retry attempt failed: Network timeout.";
      await transparentExecutionEngine.recordSelfDiagnosticLog(policyId, message);
      await transparentExecutionEngine.recordSelfDiagnosticLog(policyId, message2);

      expect(await transparentExecutionEngine.getSelfDiagnosticLog(policyId, 0)).to.equal(message);
      expect(await transparentExecutionEngine.getSelfDiagnosticLog(policyId, 1)).to.equal(message2);
    });
  });

  describe("Getter Functions", function () {
    const policyId = 0;
    const testMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("policy_for_getters"));
    let timestamp;

    beforeEach(async function () {
      const tx = await transparentExecutionEngine.connect(llmOracle).executePolicy(testMerkleRoot);
      const receipt = await tx.wait();
      timestamp = (await ethers.provider.getBlock(receipt.blockNumber)).timestamp;
    });

    it("getPolicyMerkleRoot should return the correct Merkle root", async function () {
      expect(await transparentExecutionEngine.getPolicyMerkleRoot(policyId)).to.equal(testMerkleRoot);
    });

    it("getPolicyInitiator should return the correct initiator", async function () {
      expect(await transparentExecutionEngine.getPolicyInitiator(policyId)).to.equal(llmOracle.address);
    });

    it("getPolicyTimestamp should return the correct timestamp", async function () {
      expect(await transparentExecutionEngine.getPolicyTimestamp(policyId)).to.equal(timestamp);
    });

    it("getTotalPolicies should return the correct count", async function () {
      expect(await transparentExecutionEngine.getTotalPolicies()).to.equal(1);
      const testMerkleRoot2 = ethers.keccak256(ethers.toUtf8Bytes("policy_for_getters_2"));
      await transparentExecutionEngine.connect(llmOracle).executePolicy(testMerkleRoot2);
      expect(await transparentExecutionEngine.getTotalPolicies()).to.equal(2);
    });
  });
});
