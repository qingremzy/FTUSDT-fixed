const assert = require("node:assert/strict");
const { ethers, network } = require("hardhat");

const units = (value) => ethers.parseUnits(value, 6);

describe("FTUSDT supporting contracts", function () {
  async function deploy(name, ...args) {
    const factory = await ethers.getContractFactory(name);
    const instance = await factory.deploy(...args);
    await instance.waitForDeployment();
    return instance;
  }

  it("locks the collateral token after its first configuration", async function () {
    const [owner, other] = await ethers.getSigners();
    const collateral = await deploy("MockCollateral", 1000);
    const replacement = await deploy("MockCollateral", 1000);
    const manager = await deploy("CollateralManager");

    await manager.setCollateralToken(await collateral.getAddress());
    assert.equal(await manager.collateralToken(), await collateral.getAddress());

    await assert.rejects(
      manager.setCollateralToken(await replacement.getAddress()),
      /Collateral token already configured/
    );
    await assert.rejects(
      manager.connect(other).setCollateralToken(await replacement.getAddress()),
      /Ownable: caller is not the owner/
    );
  });

  it("restricts oracle updates and rejects zero prices", async function () {
    const [owner, other] = await ethers.getSigners();
    const oracle = await deploy("PriceOracle");

    assert.equal(await oracle.getPrice(), ethers.parseUnits("1", 18));
    assert.equal(await oracle.getCollateralPrice(), ethers.parseUnits("1", 18));

    await assert.rejects(
      oracle.connect(other).updatePrice("COLLATERAL", ethers.parseUnits("2", 18)),
      /Ownable: caller is not the owner/
    );
    await assert.rejects(oracle.updatePrice("COLLATERAL", 0), /Price must be positive/);
    await oracle.updatePrice("COLLATERAL", ethers.parseUnits("2", 18));
    assert.equal(await oracle.getCollateralPrice(), ethers.parseUnits("2", 18));
  });

  it("enforces mock collateral balances and allowances", async function () {
    const [owner, user, spender] = await ethers.getSigners();
    const collateral = await deploy("MockCollateral", 1000);
    const initial = units("1000");

    assert.equal(await collateral.balanceOf(owner.address), initial);
    await collateral.transfer(user.address, units("10"));
    await collateral.connect(user).approve(spender.address, units("4"));
    await collateral.connect(spender).transferFrom(user.address, spender.address, units("4"));

    assert.equal(await collateral.balanceOf(spender.address), units("4"));
    assert.equal(await collateral.allowance(user.address, spender.address), 0n);
    await assert.rejects(
      collateral.connect(spender).transferFrom(user.address, spender.address, 1n),
      /Allowance exceeded/
    );
  });

  it("reserves purchased insurance coverage and pays an approved claim", async function () {
    const [owner, claimant] = await ethers.getSigners();
    const token = await deploy("MockCollateral", 10000);
    const pool = await deploy("InsurancePool", await token.getAddress());

    await token.connect(owner).transfer(claimant.address, units("10"));
    await token.connect(claimant).approve(await pool.getAddress(), units("1"));
    await pool.connect(claimant).payPremium(units("1000"));

    assert.equal(await pool.coverageRemaining(claimant.address), units("1000"));
    await pool.connect(claimant).submitClaim(units("600"), "Covered test incident");
    assert.equal(await pool.coverageRemaining(claimant.address), units("400"));

    await token.mint(await pool.getAddress(), units("600"));
    await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");

    const before = await token.balanceOf(claimant.address);
    await pool.resolveClaim(0, true);
    const after = await token.balanceOf(claimant.address);

    assert.equal(after - before, units("600"));
    assert.equal(await pool.totalPaidOut(), units("600"));
    const claim = await pool.claims(0);
    assert.equal(claim.status, 3n);
  });

  it("restores reserved coverage when a claim is rejected within the policy period", async function () {
    const [owner, claimant] = await ethers.getSigners();
    const token = await deploy("MockCollateral", 10000);
    const pool = await deploy("InsurancePool", await token.getAddress());

    await token.transfer(claimant.address, units("10"));
    await token.connect(claimant).approve(await pool.getAddress(), units("1"));
    await pool.connect(claimant).payPremium(units("1000"));
    await pool.connect(claimant).submitClaim(units("250"), "Rejected test claim");

    assert.equal(await pool.coverageRemaining(claimant.address), units("750"));
    await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await pool.resolveClaim(0, false);

    assert.equal(await pool.coverageRemaining(claimant.address), units("1000"));
    const claim = await pool.claims(0);
    assert.equal(claim.status, 2n);
  });
});
