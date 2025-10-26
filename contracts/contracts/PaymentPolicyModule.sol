// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PaymentPolicyModule
 * @dev Smart contract for managing payment policies including allow-lists, spending caps, and emergency controls
 * @notice This contract enforces business payment policies for vendor payments
 */
contract PaymentPolicyModule is Ownable, Pausable, ReentrancyGuard {
    
    // Events
    event VendorAllowListUpdated(address indexed vendor, bool allowed);
    event SpendingCapUpdated(address indexed user, uint256 newCap);
    event PaymentExecuted(address indexed user, address indexed vendor, uint256 amount);
    event EmergencyPauseActivated(address indexed admin);
    event EmergencyPauseDeactivated(address indexed admin);
    
    // Errors
    error VendorNotAllowed(address vendor);
    error SpendingCapExceeded(address user, uint256 requested, uint256 available);
    error InvalidAmount();
    error InvalidAddress();
    error UnauthorizedAccess();
    
    // State variables
    mapping(address => bool) private _allowedVendors;
    mapping(address => uint256) private _spendingCaps;
    mapping(address => uint256) private _spentAmounts;
    
    // Admin addresses with special permissions
    mapping(address => bool) private _admins;
    
    // Default spending cap for new users
    uint256 public defaultSpendingCap = 10000 * 10**6; // 10,000 PYUSD (6 decimals)
    
    modifier onlyAdmin() {
        if (!_admins[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress();
        }
        _;
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {
        _admins[initialOwner] = true;
    }
    
    /**
     * @dev Check if a vendor is allowed for payments
     * @param vendor The vendor address to check
     * @return bool True if vendor is allowed
     */
    function isVendorAllowed(address vendor) external view returns (bool) {
        return _allowedVendors[vendor];
    }
    
    /**
     * @dev Get the spending cap for a user
     * @param user The user address to check
     * @return uint256 The spending cap amount
     */
    function getSpendingCap(address user) external view returns (uint256) {
        uint256 cap = _spendingCaps[user];
        return cap == 0 ? defaultSpendingCap : cap;
    }
    
    /**
     * @dev Get the remaining spending allowance for a user
     * @param user The user address to check
     * @return uint256 The remaining spending allowance
     */
    function getRemainingAllowance(address user) external view returns (uint256) {
        uint256 cap = _spendingCaps[user];
        if (cap == 0) cap = defaultSpendingCap;
        
        uint256 spent = _spentAmounts[user];
        return spent >= cap ? 0 : cap - spent;
    }
    
    /**
     * @dev Get the total amount spent by a user
     * @param user The user address to check
     * @return uint256 The total spent amount
     */
    function getSpentAmount(address user) external view returns (uint256) {
        return _spentAmounts[user];
    }
    
    /**
     * @dev Update the allow-list for multiple vendors
     * @param vendors Array of vendor addresses
     * @param allowed Array of boolean values indicating if each vendor is allowed
     */
    function updateAllowList(
        address[] calldata vendors,
        bool[] calldata allowed
    ) external onlyAdmin {
        if (vendors.length != allowed.length) {
            revert InvalidAmount();
        }
        
        for (uint256 i = 0; i < vendors.length; i++) {
            if (vendors[i] == address(0)) {
                revert InvalidAddress();
            }
            
            _allowedVendors[vendors[i]] = allowed[i];
            emit VendorAllowListUpdated(vendors[i], allowed[i]);
        }
    }
    
    /**
     * @dev Add a single vendor to the allow-list
     * @param vendor The vendor address to add
     */
    function addVendor(address vendor) external onlyAdmin validAddress(vendor) {
        _allowedVendors[vendor] = true;
        emit VendorAllowListUpdated(vendor, true);
    }
    
    /**
     * @dev Remove a single vendor from the allow-list
     * @param vendor The vendor address to remove
     */
    function removeVendor(address vendor) external onlyAdmin validAddress(vendor) {
        _allowedVendors[vendor] = false;
        emit VendorAllowListUpdated(vendor, false);
    }
    
    /**
     * @dev Set spending cap for a user
     * @param user The user address
     * @param cap The new spending cap amount
     */
    function setSpendingCap(address user, uint256 cap) external onlyAdmin validAddress(user) {
        _spendingCaps[user] = cap;
        emit SpendingCapUpdated(user, cap);
    }
    
    /**
     * @dev Set spending caps for multiple users
     * @param users Array of user addresses
     * @param caps Array of spending cap amounts
     */
    function setSpendingCaps(
        address[] calldata users,
        uint256[] calldata caps
    ) external onlyAdmin {
        if (users.length != caps.length) {
            revert InvalidAmount();
        }
        
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == address(0)) {
                revert InvalidAddress();
            }
            
            _spendingCaps[users[i]] = caps[i];
            emit SpendingCapUpdated(users[i], caps[i]);
        }
    }
    
    /**
     * @dev Validate and record a payment (called before actual payment execution)
     * @param user The user making the payment
     * @param vendor The vendor receiving the payment
     * @param amount The payment amount
     */
    function validatePayment(
        address user,
        address vendor,
        uint256 amount
    ) external whenNotPaused nonReentrant validAddress(user) validAddress(vendor) {
        if (amount == 0) {
            revert InvalidAmount();
        }
        
        // Check if vendor is allowed
        if (!_allowedVendors[vendor]) {
            revert VendorNotAllowed(vendor);
        }
        
        // Check spending cap
        uint256 cap = _spendingCaps[user];
        if (cap == 0) cap = defaultSpendingCap;
        
        uint256 newSpentAmount = _spentAmounts[user] + amount;
        if (newSpentAmount > cap) {
            revert SpendingCapExceeded(user, amount, cap - _spentAmounts[user]);
        }
        
        // Update spent amount
        _spentAmounts[user] = newSpentAmount;
        
        emit PaymentExecuted(user, vendor, amount);
    }
    
    /**
     * @dev Reset spent amount for a user (admin function for new periods)
     * @param user The user address to reset
     */
    function resetSpentAmount(address user) external onlyAdmin validAddress(user) {
        _spentAmounts[user] = 0;
    }
    
    /**
     * @dev Reset spent amounts for multiple users
     * @param users Array of user addresses to reset
     */
    function resetSpentAmounts(address[] calldata users) external onlyAdmin {
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0)) {
                _spentAmounts[users[i]] = 0;
            }
        }
    }
    
    /**
     * @dev Set the default spending cap for new users
     * @param newDefaultCap The new default spending cap
     */
    function setDefaultSpendingCap(uint256 newDefaultCap) external onlyOwner {
        defaultSpendingCap = newDefaultCap;
    }
    
    /**
     * @dev Add an admin address
     * @param admin The address to grant admin privileges
     */
    function addAdmin(address admin) external onlyOwner validAddress(admin) {
        _admins[admin] = true;
    }
    
    /**
     * @dev Remove an admin address
     * @param admin The address to revoke admin privileges
     */
    function removeAdmin(address admin) external onlyOwner validAddress(admin) {
        _admins[admin] = false;
    }
    
    /**
     * @dev Check if an address has admin privileges
     * @param admin The address to check
     * @return bool True if address is an admin
     */
    function isAdmin(address admin) external view returns (bool) {
        return _admins[admin] || admin == owner();
    }
    
    /**
     * @dev Emergency pause function to halt all payment validations
     */
    function emergencyPause() external onlyAdmin {
        _pause();
        emit EmergencyPauseActivated(msg.sender);
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyPauseDeactivated(msg.sender);
    }
    
    /**
     * @dev Get contract status information
     * @return paused Whether the contract is paused
     * @return totalVendors Total number of allowed vendors (approximation)
     * @return defaultCap The default spending cap
     */
    function getContractStatus() external view returns (
        bool paused,
        uint256 defaultCap
    ) {
        return (
            paused(),
            defaultSpendingCap
        );
    }
}