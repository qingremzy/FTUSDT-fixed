const assert = require("node:assert/strict");
const { ethers, network } = require("hardhat");

const units = (value) => ethers.parseUnits(value, 6);

describe("FTUSDT protocol core flows", function () {
  async function deploy(name, ...args) {
    const factory = await ethers.getContractFactory(name);
    const instance = await factory.deploy(...args);
    await instance.waitForDeployment();
    return instance;
  }

  async function fixture() {
    const [owner, borrower, liquidator] = await ethers.getSigners();
    const oracle = await deploy("PriceOracle");
    const manager = await deploy("CollateralManager");
    const collateral = await deploy("MockCollateral", 10000);
    const governance = await deploy("Governance");
    const insurance = await deploy("InsurancePool", ethers.ZeroAddress);
    const token = await deploy(
      "FTUSDT",
      1000,
      await oracle.getAddress(),
      await manager.getAddress(),
      await governance.getAddress(),
      await insurance.getAddress()
    );

    await insurance.setFTUSDT(await token.getAddress());
    await manager.setProtocol(await token.getAddress());
    await manager.setCollateralToken(await collateral.getAddress());
    await governance.setExecutionTarget(await token.getAddress());

    return { owner, borrower, liquidator, oracle, manager, collateral, governance, insurance, token };
  }

  it("mints FTUSDT only against approved collateral and records the vault position", async function () {
    const { owner, borrower, collateral, manager, token } = await fixture();
    await collateral.transfer(borrower.address, units("200"));
    await collateral.connect(borrower).approve(await manager.getAddress(), units("150"));

    await token.connect(borrower).mintWithCollateral(units("150"), units("100"));

    assert.equal(await token.balanceOf(borrower.address), units("100"));
    const position = await token.collateralPositions(borrower.address);
    assert.equal(position.collateralAmount, units("150"));
    assert.equal(position.debtAmount, units("100"));
    assert.equal(await collateral.balanceOf(await manager.getAddress()), units("150"));
  });

  it("locks collateral for a loan and accrues interest without double-counting after partial repayment", async function () {
    const { borrower, collateral, manager, token } = await fixture();
    await collateral.transfer(borrower.address, units("300"));
    await collateral.connect(borrower).approve(await manager.getAddress(), units("300"));
    await token.connect(borrower).mintWithCollateral(units("300"), units("200"));

    await token.connect(borrower).createLoan(units("100"), 30 * 24 * 60 * 60);
    const loanBefore = await token.userLoans(borrower.address, 0);
    assert.equal(loanBefore.active, true);
    assert.equal(loanBefore.collateralAmount, units("150"));

    await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await token.connect(borrower).repayLoan(0, units("20"));
    const afterFirstPayment = await token.userLoans(borrower.address, 0);
    assert.equal(afterFirstPayment.totalRepaid, units("20"));
    assert(afterFirstPayment.accruedInterest > 0n);

    await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await token.connect(borrower).repayLoan(0, units("20"));
    const afterSecondPayment = await token.userLoans(borrower.address, 0);
    assert.equal(afterSecondPayment.totalRepaid, units("40"));
    assert(afterSecondPayment.accruedInterest >= afterFirstPayment.accruedInterest);
  });

  it("returns unseized collateral to the borrower when an overdue loan is liquidated", async function () {
    const { borrower, liquidator, collateral, manager, token } = await fixture();
    await collateral.transfer(borrower.address, units("300"));
    await collateral.connect(borrower).approve(await manager.getAddress(), units("300"));
    await token.connect(borrower).mintWithCollateral(units("300"), units("200"));
    await token.connect(borrower).createLoan(units("100"), 24 * 60 * 60);

    await token.transfer(liquidator.address, units("200"));
    await network.provider.send("evm_increaseTime", [24 * 60 * 60 + 10]);
    await network.provider.send("evm_mine");
    const liquidatorBefore = await collateral.balanceOf(liquidator.address);
    await token.connect(liquidator).liquidateLoan(borrower.address, 0);
    const liquidatorAfter = await collateral.balanceOf(liquidator.address);

    assert(liquidatorAfter > liquidatorBefore);
    const position = await token.collateralPositions(borrower.address);
    assert(position.collateralAmount > 0n);
    const loan = await token.userLoans(borrower.address, 0);
    assert.equal(loan.active, false);
  });

  it("executes a flash loan only when principal and fee are returned", async function () {
    const { owner, token } = await fixture();
    const receiver = await deploy("MockFlashLoanReceiver", await token.getAddress());
    const amount = units("100");
    const fee = (amount * 9n) / 10000n;

    await token.transfer(await token.getAddress(), amount);
    await token.transfer(await receiver.getAddress(), fee);
    const before = await token.balanceOf(await token.getAddress());

    await token.flashLoan(await receiver.getAddress(), amount, "0x");

    assert.equal(await token.balanceOf(await token.getAddress()), before + fee);
  });
});
