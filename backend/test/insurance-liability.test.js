const assert = require("node:assert/strict");
const { ethers, network } = require("hardhat");

const units = (value) => ethers.parseUnits(value, 6);

describe("InsurancePool liability accounting", function () {
  async function deploy(name, ...args) {
    const factory = await ethers.getContractFactory(name);
    const instance = await factory.deploy(...args);
    await instance.waitForDeployment();
    return instance;
  }

  it("prevents the owner from withdrawing funds reserved for active coverage", async function () {
    const [owner, claimant] = await ethers.getSigners();
    const token = await deploy("MockCollateral", 10000);
    const pool = await deploy("InsurancePool", await token.getAddress());

    await token.transfer(claimant.address, units("10"));
    await token.connect(claimant).approve(await pool.getAddress(), units("1"));
    await pool.connect(claimant).payPremium(units("1000"));

    assert.equal(await pool.totalCoverageLiability(), units("1000"));
    assert.equal(await pool.getExcessFunds(), 0n);

    await token.mint(await pool.getAddress(), units("2000"));
    assert.equal(await pool.getExcessFunds(), units("1001"));
    await assert.rejects(
      pool.withdrawExcessFunds(units("1002")),
      /Amount exceeds excess funds/
    );

    await pool.withdrawExcessFunds(units("1001"));
    assert.equal(await token.balanceOf(await pool.getAddress()), units("1000"));
    assert.equal(await pool.totalCoverageLiability(), units("1000"));
  });

  it("releases expired unused cover when the user buys a new policy period", async function () {
    const [owner, claimant] = await ethers.getSigners();
    const token = await deploy("MockCollateral", 10000);
    const pool = await deploy("InsurancePool", await token.getAddress());

    await token.transfer(claimant.address, units("10"));
    await token.connect(claimant).approve(await pool.getAddress(), units("2"));
    await pool.connect(claimant).payPremium(units("1000"));

    await network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await pool.connect(claimant).payPremium(units("500"));

    assert.equal(await pool.coverageRemaining(claimant.address), units("500"));
    assert.equal(await pool.totalCoverageLiability(), units("500"));
  });

  it("keeps a pending claim reserved and releases liability only after payout", async function () {
    const [owner, claimant] = await ethers.getSigners();
    const token = await deploy("MockCollateral", 10000);
    const pool = await deploy("InsurancePool", await token.getAddress());

    await token.transfer(claimant.address, units("10"));
    await token.connect(claimant).approve(await pool.getAddress(), units("1"));
    await pool.connect(claimant).payPremium(units("1000"));
    await pool.connect(claimant).submitClaim(units("600"), "Covered loss");

    assert.equal(await pool.totalCoverageLiability(), units("1000"));
    assert.equal(await pool.coverageRemaining(claimant.address), units("400"));

    await token.mint(await pool.getAddress(), units("1000"));
    await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await pool.resolveClaim(0, true);

    assert.equal(await pool.totalCoverageLiability(), units("400"));
    assert.equal(await pool.totalPaidOut(), units("600"));
    assert.equal(await pool.getExcessFunds(), units("400"));
  });
});
