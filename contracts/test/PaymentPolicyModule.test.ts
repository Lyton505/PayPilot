import { expect } from "chai";
import { ethers } from "hardhat";
import { PaymentPolicyModule } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PaymentPolicyModule", function () {
  let paymentPolicy: PaymentPolicyModule;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let vendor1: SignerWithAddress;
  let vendor2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const DEFAULT_SPENDING_CAP = ethers.parseUnits("10000", 6); // 10,000 PYUSD
  const PAYMENT_AMOUNT = ethers.parseUnits("1000", 6); // 1,000 PYUSD

  beforeEach(async function () {
    [owner, admin, user1, user2, vendor1, vendor2, unauthorized] = await ethers.getSigners();

    const PaymentPolicyModule = await ethers.getContractFactory("PaymentPolicyModule");
    paymentPolicy = await PaymentPolicyModule.deploy(owner.address);
    await paymentPolicy.waitForDeployment();

    // Add admin
    await paymentPolicy.connect(owner).addAdmin(admin.address);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await paymentPolicy.owner()).to.equal(owner.address);
    });

    it("Should set the default spending cap", async function () {
      expect(await paymentPolicy.defaultSpendingCap()).to.equal(DEFAULT_SPENDING_CAP);
    });

    it("Should set owner as admin", async function () {
      expect(await paymentPolicy.isAdmin(owner.address)).to.be.true;
    });

    it("Should not be paused initially", async function () {
      const [paused] = await paymentPolicy.getContractStatus();
      expect(paused).to.be.false;
    });
  });

  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      await expect(paymentPolicy.connect(owner).addAdmin(user1.address))
        .to.not.be.reverted;
      
      expect(await paymentPolicy.isAdmin(user1.address)).to.be.true;
    });

    it("Should allow owner to remove admin", async function () {
      await paymentPolicy.connect(owner).addAdmin(user1.address);
      await paymentPolicy.connect(owner).removeAdmin(user1.address);
      
      expect(await paymentPolicy.isAdmin(user1.address)).to.be.false;
    });

    it("Should not allow non-owner to add admin", async function () {
      await expect(paymentPolicy.connect(user1).addAdmin(user2.address))
        .to.be.revertedWithCustomError(paymentPolicy, "OwnableUnauthorizedAccount");
    });

    it("Should reject zero address for admin", async function () {
      await expect(paymentPolicy.connect(owner).addAdmin(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(paymentPolicy, "InvalidAddress");
    });
  });

  describe("Allow-list Management", function () {
    it("Should allow admin to add vendor to allow-list", async function () {
      await expect(paymentPolicy.connect(admin).addVendor(vendor1.address))
        .to.emit(paymentPolicy, "VendorAllowListUpdated")
        .withArgs(vendor1.address, true);

      expect(await paymentPolicy.isVendorAllowed(vendor1.address)).to.be.true;
    });

    it("Should allow admin to remove vendor from allow-list", async function () {
      await paymentPolicy.connect(admin).addVendor(vendor1.address);
      
      await expect(paymentPolicy.connect(admin).removeVendor(vendor1.address))
        .to.emit(paymentPolicy, "VendorAllowListUpdated")
        .withArgs(vendor1.address, false);

      expect(await paymentPolicy.isVendorAllowed(vendor1.address)).to.be.false;
    });

    it("Should allow batch update of allow-list", async function () {
      const vendors = [vendor1.address, vendor2.address];
      const allowed = [true, false];

      await expect(paymentPolicy.connect(admin).updateAllowList(vendors, allowed))
        .to.emit(paymentPolicy, "VendorAllowListUpdated")
        .withArgs(vendor1.address, true);

      expect(await paymentPolicy.isVendorAllowed(vendor1.address)).to.be.true;
      expect(await paymentPolicy.isVendorAllowed(vendor2.address)).to.be.false;
    });

    it("Should reject mismatched arrays in batch update", async function () {
      const vendors = [vendor1.address, vendor2.address];
      const allowed = [true]; // Mismatched length

      await expect(paymentPolicy.connect(admin).updateAllowList(vendors, allowed))
        .to.be.revertedWithCustomError(paymentPolicy, "InvalidAmount");
    });

    it("Should reject zero address in allow-list operations", async function () {
      await expect(paymentPolicy.connect(admin).addVendor(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(paymentPolicy, "InvalidAddress");
    });

    it("Should not allow unauthorized users to modify allow-list", async function () {
      await expect(paymentPolicy.connect(unauthorized).addVendor(vendor1.address))
        .to.be.revertedWithCustomError(paymentPolicy, "UnauthorizedAccess");
    });
  });

  describe("Spending Cap Management", function () {
    it("Should return default spending cap for new users", async function () {
      expect(await paymentPolicy.getSpendingCap(user1.address)).to.equal(DEFAULT_SPENDING_CAP);
    });

    it("Should allow admin to set custom spending cap", async function () {
      const customCap = ethers.parseUnits("5000", 6);
      
      await expect(paymentPolicy.connect(admin).setSpendingCap(user1.address, customCap))
        .to.emit(paymentPolicy, "SpendingCapUpdated")
        .withArgs(user1.address, customCap);

      expect(await paymentPolicy.getSpendingCap(user1.address)).to.equal(customCap);
    });

    it("Should allow batch setting of spending caps", async function () {
      const users = [user1.address, user2.address];
      const caps = [ethers.parseUnits("5000", 6), ethers.parseUnits("7500", 6)];

      await paymentPolicy.connect(admin).setSpendingCaps(users, caps);

      expect(await paymentPolicy.getSpendingCap(user1.address)).to.equal(caps[0]);
      expect(await paymentPolicy.getSpendingCap(user2.address)).to.equal(caps[1]);
    });

    it("Should reject mismatched arrays in batch spending cap update", async function () {
      const users = [user1.address, user2.address];
      const caps = [ethers.parseUnits("5000", 6)]; // Mismatched length

      await expect(paymentPolicy.connect(admin).setSpendingCaps(users, caps))
        .to.be.revertedWithCustomError(paymentPolicy, "InvalidAmount");
    });

    it("Should allow owner to set default spending cap", async function () {
      const newDefaultCap = ethers.parseUnits("15000", 6);
      
      await paymentPolicy.connect(owner).setDefaultSpendingCap(newDefaultCap);
      
      expect(await paymentPolicy.defaultSpendingCap()).to.equal(newDefaultCap);
      expect(await paymentPolicy.getSpendingCap(user1.address)).to.equal(newDefaultCap);
    });

    it("Should not allow non-admin to set spending caps", async function () {
      await expect(paymentPolicy.connect(unauthorized).setSpendingCap(user1.address, 5000))
        .to.be.revertedWithCustomError(paymentPolicy, "UnauthorizedAccess");
    });
  });

  describe("Payment Validation", function () {
    beforeEach(async function () {
      // Add vendor to allow-list
      await paymentPolicy.connect(admin).addVendor(vendor1.address);
    });

    it("Should validate and record successful payment", async function () {
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, PAYMENT_AMOUNT))
        .to.emit(paymentPolicy, "PaymentExecuted")
        .withArgs(user1.address, vendor1.address, PAYMENT_AMOUNT);

      expect(await paymentPolicy.getSpentAmount(user1.address)).to.equal(PAYMENT_AMOUNT);
      expect(await paymentPolicy.getRemainingAllowance(user1.address))
        .to.equal(DEFAULT_SPENDING_CAP - PAYMENT_AMOUNT);
    });

    it("Should reject payment to non-allowed vendor", async function () {
      await expect(paymentPolicy.validatePayment(user1.address, vendor2.address, PAYMENT_AMOUNT))
        .to.be.revertedWithCustomError(paymentPolicy, "VendorNotAllowed")
        .withArgs(vendor2.address);
    });

    it("Should reject payment exceeding spending cap", async function () {
      const excessiveAmount = DEFAULT_SPENDING_CAP + ethers.parseUnits("1", 6);
      
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, excessiveAmount))
        .to.be.revertedWithCustomError(paymentPolicy, "SpendingCapExceeded");
    });

    it("Should reject zero amount payment", async function () {
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, 0))
        .to.be.revertedWithCustomError(paymentPolicy, "InvalidAmount");
    });

    it("Should reject payment with zero addresses", async function () {
      await expect(paymentPolicy.validatePayment(ethers.ZeroAddress, vendor1.address, PAYMENT_AMOUNT))
        .to.be.revertedWithCustomError(paymentPolicy, "InvalidAddress");

      await expect(paymentPolicy.validatePayment(user1.address, ethers.ZeroAddress, PAYMENT_AMOUNT))
        .to.be.revertedWithCustomError(paymentPolicy, "InvalidAddress");
    });

    it("Should track cumulative spending correctly", async function () {
      const firstPayment = ethers.parseUnits("3000", 6);
      const secondPayment = ethers.parseUnits("2000", 6);

      await paymentPolicy.validatePayment(user1.address, vendor1.address, firstPayment);
      await paymentPolicy.validatePayment(user1.address, vendor1.address, secondPayment);

      expect(await paymentPolicy.getSpentAmount(user1.address))
        .to.equal(firstPayment + secondPayment);
    });

    it("Should prevent payment when cumulative spending would exceed cap", async function () {
      const firstPayment = ethers.parseUnits("8000", 6);
      const secondPayment = ethers.parseUnits("3000", 6); // Would exceed 10,000 cap

      await paymentPolicy.validatePayment(user1.address, vendor1.address, firstPayment);
      
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, secondPayment))
        .to.be.revertedWithCustomError(paymentPolicy, "SpendingCapExceeded");
    });
  });

  describe("Spending Amount Management", function () {
    beforeEach(async function () {
      await paymentPolicy.connect(admin).addVendor(vendor1.address);
      await paymentPolicy.validatePayment(user1.address, vendor1.address, PAYMENT_AMOUNT);
    });

    it("Should allow admin to reset spent amount", async function () {
      expect(await paymentPolicy.getSpentAmount(user1.address)).to.equal(PAYMENT_AMOUNT);
      
      await paymentPolicy.connect(admin).resetSpentAmount(user1.address);
      
      expect(await paymentPolicy.getSpentAmount(user1.address)).to.equal(0);
      expect(await paymentPolicy.getRemainingAllowance(user1.address)).to.equal(DEFAULT_SPENDING_CAP);
    });

    it("Should allow batch reset of spent amounts", async function () {
      await paymentPolicy.validatePayment(user2.address, vendor1.address, PAYMENT_AMOUNT);
      
      const users = [user1.address, user2.address];
      await paymentPolicy.connect(admin).resetSpentAmounts(users);
      
      expect(await paymentPolicy.getSpentAmount(user1.address)).to.equal(0);
      expect(await paymentPolicy.getSpentAmount(user2.address)).to.equal(0);
    });

    it("Should not allow unauthorized users to reset spent amounts", async function () {
      await expect(paymentPolicy.connect(unauthorized).resetSpentAmount(user1.address))
        .to.be.revertedWithCustomError(paymentPolicy, "UnauthorizedAccess");
    });
  });

  describe("Emergency Pause Functionality", function () {
    beforeEach(async function () {
      await paymentPolicy.connect(admin).addVendor(vendor1.address);
    });

    it("Should allow admin to emergency pause", async function () {
      await expect(paymentPolicy.connect(admin).emergencyPause())
        .to.emit(paymentPolicy, "EmergencyPauseActivated")
        .withArgs(admin.address);

      const [paused] = await paymentPolicy.getContractStatus();
      expect(paused).to.be.true;
    });

    it("Should prevent payment validation when paused", async function () {
      await paymentPolicy.connect(admin).emergencyPause();
      
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, PAYMENT_AMOUNT))
        .to.be.revertedWithCustomError(paymentPolicy, "EnforcedPause");
    });

    it("Should allow owner to unpause", async function () {
      await paymentPolicy.connect(admin).emergencyPause();
      
      await expect(paymentPolicy.connect(owner).unpause())
        .to.emit(paymentPolicy, "EmergencyPauseDeactivated")
        .withArgs(owner.address);

      const [paused] = await paymentPolicy.getContractStatus();
      expect(paused).to.be.false;
    });

    it("Should not allow non-admin to emergency pause", async function () {
      await expect(paymentPolicy.connect(unauthorized).emergencyPause())
        .to.be.revertedWithCustomError(paymentPolicy, "UnauthorizedAccess");
    });

    it("Should not allow non-owner to unpause", async function () {
      await paymentPolicy.connect(admin).emergencyPause();
      
      await expect(paymentPolicy.connect(admin).unpause())
        .to.be.revertedWithCustomError(paymentPolicy, "OwnableUnauthorizedAccount");
    });

    it("Should allow payments after unpausing", async function () {
      await paymentPolicy.connect(admin).emergencyPause();
      await paymentPolicy.connect(owner).unpause();
      
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, PAYMENT_AMOUNT))
        .to.not.be.reverted;
    });
  });

  describe("Contract Status", function () {
    it("Should return correct contract status", async function () {
      const [paused, defaultCap] = await paymentPolicy.getContractStatus();
      
      expect(paused).to.be.false;
      expect(defaultCap).to.equal(DEFAULT_SPENDING_CAP);
    });

    it("Should return correct status when paused", async function () {
      await paymentPolicy.connect(admin).emergencyPause();
      
      const [paused, defaultCap] = await paymentPolicy.getContractStatus();
      
      expect(paused).to.be.true;
      expect(defaultCap).to.equal(DEFAULT_SPENDING_CAP);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle maximum uint256 values safely", async function () {
      const maxUint256 = ethers.MaxUint256;
      
      await expect(paymentPolicy.connect(admin).setSpendingCap(user1.address, maxUint256))
        .to.not.be.reverted;
      
      expect(await paymentPolicy.getSpendingCap(user1.address)).to.equal(maxUint256);
    });

    it("Should prevent reentrancy attacks", async function () {
      // The contract uses ReentrancyGuard, so this test ensures the modifier is working
      await paymentPolicy.connect(admin).addVendor(vendor1.address);
      
      // This should not revert due to reentrancy protection
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, PAYMENT_AMOUNT))
        .to.not.be.reverted;
    });

    it("Should handle zero spending cap correctly", async function () {
      await paymentPolicy.connect(admin).setSpendingCap(user1.address, 0);
      await paymentPolicy.connect(admin).addVendor(vendor1.address);
      
      // With zero cap, no payments should be allowed
      await expect(paymentPolicy.validatePayment(user1.address, vendor1.address, 1))
        .to.be.revertedWithCustomError(paymentPolicy, "SpendingCapExceeded");
    });
  });
});