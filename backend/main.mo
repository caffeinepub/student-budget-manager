import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

import Iter "mo:core/Iter";

// Apply migration on upgrade

actor {
  // ── Access Control ─────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Data Types ──────────────────────────────────────────
  public type IncomeSource = {
    name : Text;
    amount : Float;
  };

  public type BudgetAllocation = {
    spendingPct : Float;
    savingPct : Float;
    investingPct : Float;
  };

  public type Expense = {
    amount : Float;
    category : Text;
    date : Int;
    note : Text;
  };

  public type SavingsGoal = {
    name : Text;
    targetAmount : Float;
    currentAmount : Float;
    deadline : Int;
    locked : Bool;
  };

  public type UnlockCondition = {
    #goalMet : Nat;
    #timePeriod : Int;
  };

  public type DigitalLocker = {
    locked : Bool;
    conditionType : ?UnlockCondition;
    unlockDate : ?Int;
  };

  public type UserProfile = {
    displayName : Text;
  };

  public type Profile = {
    userProfile : UserProfile;
    incomeSources : [IncomeSource];
    allocation : BudgetAllocation;
    expenses : [Expense];
    savingsGoals : [SavingsGoal];
    digitalLocker : DigitalLocker;
  };

  public type CompleteProfile = {
    profile : Profile;
  };

  // ── Wallet and KYC ─────────────────────────────
  public type KycStatus = {
    #none;
    #basic;
    #full;
  };

  public type KycDetails = {
    name : Text;
    dob : Text;
    phone : Text;
    aadhaarLast4 : Text;
    address : ?Text;
    photoIdRef : ?Text;
  };

  public type TransactionType = {
    #credit;
    #debit;
    #lockerTransfer;
  };

  public type Transaction = {
    id : Nat;
    amount : Nat;
    transactionType : TransactionType;
    transactionLabel : Text;
    note : Text;
    timestamp : Int;
  };

  public type Wallet = {
    balance : Nat;
    pinHash : ?Text;
    kycStatus : KycStatus;
    kycDetails : ?KycDetails;
    transactions : [Transaction];
    transactionCounter : Nat;
  };

  public type WalletProfile = {
    balance : Nat;
    kycStatus : KycStatus;
    hasPin : Bool;
  };

  public type WalletSummary = {
    principal : Principal;
    balance : Nat;
    kycStatus : KycStatus;
    transactionCount : Nat;
  };

  public type SystemStats = {
    totalUsers : Nat;
    totalBalance : Nat;
    basicKycCount : Nat;
    fullKycCount : Nat;
  };

  // ── State ───────────────────────────────────────────────
  let profiles = Map.empty<Principal, CompleteProfile>();
  let wallets = Map.empty<Principal, Wallet>();

  // ── Internal helpers ────────────────────────────────────
  func emptyProfile() : CompleteProfile {
    {
      profile = {
        userProfile = { displayName = "" };
        incomeSources = [];
        allocation = { spendingPct = 50.0; savingPct = 30.0; investingPct = 20.0 };
        expenses = [];
        savingsGoals = [];
        digitalLocker = { locked = true; conditionType = null; unlockDate = null };
      };
    };
  };

  func getOrCreateProfile(user : Principal) : CompleteProfile {
    switch (profiles.get(user)) {
      case (?p) { p };
      case (null) {
        let p = emptyProfile();
        profiles.add(user, p);
        p;
      };
    };
  };

  func totalIncome(sources : [IncomeSource]) : Float {
    var total : Float = 0.0;
    for (s in sources.values()) { total += s.amount };
    total;
  };

  // ── User Profile (required by frontend) ────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (profiles.get(caller)) {
      case (?p) { ?p.profile.userProfile };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(up : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let existing = getOrCreateProfile(caller);
    let updated : CompleteProfile = {
      profile = {
        userProfile = up;
        incomeSources = existing.profile.incomeSources;
        allocation = existing.profile.allocation;
        expenses = existing.profile.expenses;
        savingsGoals = existing.profile.savingsGoals;
        digitalLocker = existing.profile.digitalLocker;
      };
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (?p) { ?p.profile.userProfile };
      case (null) { null };
    };
  };

  // ── Income ──────────────────────────────────────────────
  public shared ({ caller }) func addIncome(name : Text, amount : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add income");
    };
    let existing = getOrCreateProfile(caller);
    let newSource : IncomeSource = { name = name; amount };
    let updated : CompleteProfile = {
      profile = {
        userProfile = existing.profile.userProfile;
        incomeSources = existing.profile.incomeSources.concat([newSource]);
        allocation = existing.profile.allocation;
        expenses = existing.profile.expenses;
        savingsGoals = existing.profile.savingsGoals;
        digitalLocker = existing.profile.digitalLocker;
      };
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getProfile(user : Principal) : async Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p.profile };
    };
  };

  // ── Budget Allocation ───────────────────────────────────
  public shared ({ caller }) func setAllocationSplit(spending : Float, saving : Float, investing : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set allocation");
    };
    if (spending + saving + investing != 100.0) {
      Runtime.trap("Allocation percentages must sum to 100");
    };
    let existing = getOrCreateProfile(caller);
    let updated : CompleteProfile = {
      profile = {
        userProfile = existing.profile.userProfile;
        incomeSources = existing.profile.incomeSources;
        allocation = { spendingPct = spending; savingPct = saving; investingPct = investing };
        expenses = existing.profile.expenses;
        savingsGoals = existing.profile.savingsGoals;
        digitalLocker = existing.profile.digitalLocker;
      };
    };
    profiles.add(caller, updated);
  };

  // ── Expenses ────────────────────────────────────────────
  public shared ({ caller }) func addExpense(amount : Float, category : Text, note : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };
    let existing = getOrCreateProfile(caller);
    let newExpense : Expense = {
      amount;
      category;
      date = Time.now();
      note;
    };
    let updated : CompleteProfile = {
      profile = {
        userProfile = existing.profile.userProfile;
        incomeSources = existing.profile.incomeSources;
        allocation = existing.profile.allocation;
        expenses = existing.profile.expenses.concat([newExpense]);
        savingsGoals = existing.profile.savingsGoals;
        digitalLocker = existing.profile.digitalLocker;
      };
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getExpenses() : async [Expense] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let p = getOrCreateProfile(caller);
    p.profile.expenses;
  };

  // ── Savings Goals ───────────────────────────────────────
  public shared ({ caller }) func addSavingsGoal(name : Text, target : Float, deadline : Int) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add savings goals");
    };
    let existing = getOrCreateProfile(caller);
    let newGoal : SavingsGoal = {
      name;
      targetAmount = target;
      currentAmount = 0.0;
      deadline;
      locked = false;
    };
    let updated : CompleteProfile = {
      profile = {
        userProfile = existing.profile.userProfile;
        incomeSources = existing.profile.incomeSources;
        allocation = existing.profile.allocation;
        expenses = existing.profile.expenses;
        savingsGoals = existing.profile.savingsGoals.concat([newGoal]);
        digitalLocker = existing.profile.digitalLocker;
      };
    };
    profiles.add(caller, updated);
  };

  public shared ({ caller }) func updateSavingsGoal(index : Nat, amount : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update savings goals");
    };
    let existing = getOrCreateProfile(caller);
    if (index >= existing.profile.savingsGoals.size()) {
      Runtime.trap("Invalid goal index");
    };

    let updatedGoals = Array.tabulate(existing.profile.savingsGoals.size(), func(i) { if (i < existing.profile.savingsGoals.size()) { if (i == index) { let g = existing.profile.savingsGoals[i]; let newAmount = g.currentAmount + amount; { name = g.name; targetAmount = g.targetAmount; currentAmount = newAmount; deadline = g.deadline; locked = g.locked } } else { existing.profile.savingsGoals[i] } } else { existing.profile.savingsGoals[0] } });

    let updated : CompleteProfile = {
      profile = {
        userProfile = existing.profile.userProfile;
        incomeSources = existing.profile.incomeSources;
        allocation = existing.profile.allocation;
        expenses = existing.profile.expenses;
        savingsGoals = updatedGoals;
        digitalLocker = existing.profile.digitalLocker;
      };
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getSavingsGoals() : async [SavingsGoal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view savings goals");
    };
    let p = getOrCreateProfile(caller);
    p.profile.savingsGoals;
  };

  // ── Digital Locker ──────────────────────────────────────
  public query ({ caller }) func getLockerStatus() : async DigitalLocker {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view locker status");
    };
    let p = getOrCreateProfile(caller);
    p.profile.digitalLocker;
  };

  public shared ({ caller }) func requestUnlock(conditionType : Text, goalIndex : ?Nat, periodDays : ?Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can request unlock");
    };
    let existing = getOrCreateProfile(caller);

    if (conditionType == "goal-met") {
      let index = switch (goalIndex) {
        case (null) { Runtime.trap("Goal index required for goal-met condition") };
        case (?i) { i };
      };
      if (index >= existing.profile.savingsGoals.size()) {
        Runtime.trap("Invalid goal index");
      };
      let goal = existing.profile.savingsGoals[index];
      if (goal.currentAmount >= goal.targetAmount) {
        let updatedLocker : DigitalLocker = {
          locked = false;
          conditionType = ?#goalMet(index);
          unlockDate = ?Time.now();
        };
        let updated : CompleteProfile = {
          profile = {
            userProfile = existing.profile.userProfile;
            incomeSources = existing.profile.incomeSources;
            allocation = existing.profile.allocation;
            expenses = existing.profile.expenses;
            savingsGoals = existing.profile.savingsGoals;
            digitalLocker = updatedLocker;
          };
        };
        profiles.add(caller, updated);
        return true;
      } else {
        return false;
      };
    } else if (conditionType == "time-period") {
      let days = switch (periodDays) {
        case (null) { Runtime.trap("Period days required for time-period condition") };
        case (?d) { d };
      };
      let unlockDate = Time.now() + (days * 24 * 3600 * 1_000_000_000);
      let updatedLocker : DigitalLocker = {
        locked = true;
        conditionType = ?#timePeriod(unlockDate);
        unlockDate = ?unlockDate;
      };
      let updated : CompleteProfile = {
        profile = {
          userProfile = existing.profile.userProfile;
          incomeSources = existing.profile.incomeSources;
          allocation = existing.profile.allocation;
          expenses = existing.profile.expenses;
          savingsGoals = existing.profile.savingsGoals;
          digitalLocker = updatedLocker;
        };
      };
      profiles.add(caller, updated);
      if (Time.now() >= unlockDate) {
        let unlockedLocker : DigitalLocker = {
          locked = false;
          conditionType = updatedLocker.conditionType;
          unlockDate = updatedLocker.unlockDate;
        };
        let finalUpdated : CompleteProfile = {
          profile = {
            userProfile = existing.profile.userProfile;
            incomeSources = existing.profile.incomeSources;
            allocation = existing.profile.allocation;
            expenses = existing.profile.expenses;
            savingsGoals = existing.profile.savingsGoals;
            digitalLocker = unlockedLocker;
          };
        };
        profiles.add(caller, finalUpdated);
        return true;
      };
      return true;
    };
    false;
  };

  // ── Investment Suggestions ──────────────────────────────
  public query ({ caller }) func getInvestmentSuggestions() : async [(Text, Float)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view investment suggestions");
    };
    let p = getOrCreateProfile(caller);
    let income = totalIncome(p.profile.incomeSources);
    let investingAmount = income * (p.profile.allocation.investingPct / 100.0);
    [
      ("Low-Risk Savings Account", investingAmount * 0.5),
      ("Government Bonds", investingAmount * 0.3),
      ("Index Funds", investingAmount * 0.2),
    ];
  };

  // ── Wallet Functions ─────────────────────────────

  public shared ({ caller }) func createWallet() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create wallets");
    };
    switch (wallets.get(caller)) {
      case (null) {
        let newWallet : Wallet = {
          balance = 0;
          pinHash = null;
          kycStatus = #none;
          kycDetails = null;
          transactions = [];
          transactionCounter = 0;
        };
        wallets.add(caller, newWallet);
      };
      case (?_) { Runtime.trap("Wallet already exists") };
    };
  };

  public shared ({ caller }) func addFundsToWallet(amount : Nat, transactionLabel : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add funds");
    };
    let existingWallet = switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Wallet not found") };
      case (?w) { w };
    };
    let updatedBalance = existingWallet.balance + amount;
    let newTransaction : Transaction = {
      id = existingWallet.transactionCounter;
      amount;
      transactionType = #credit;
      transactionLabel;
      note = "";
      timestamp = Time.now();
    };
    let updatedTransactions = existingWallet.transactions.concat([newTransaction]);
    let updatedWallet : Wallet = {
      existingWallet with
      balance = updatedBalance;
      transactions = updatedTransactions;
      transactionCounter = existingWallet.transactionCounter + 1;
    };
    wallets.add(caller, updatedWallet);
  };

  public shared ({ caller }) func deductFromWallet(amount : Nat, transactionLabel : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can deduct funds");
    };
    let existingWallet = switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Wallet not found") };
      case (?w) { w };
    };
    if (existingWallet.balance < amount) {
      Runtime.trap("Insufficient balance");
    };
    let updatedBalance = existingWallet.balance - amount;
    let newTransaction : Transaction = {
      id = existingWallet.transactionCounter;
      amount;
      transactionType = #debit;
      transactionLabel;
      note = "";
      timestamp = Time.now();
    };
    let updatedTransactions = existingWallet.transactions.concat([newTransaction]);
    let updatedWallet : Wallet = {
      existingWallet with
      balance = updatedBalance;
      transactions = updatedTransactions;
      transactionCounter = existingWallet.transactionCounter + 1;
    };
    wallets.add(caller, updatedWallet);
  };

  public shared ({ caller }) func transferToLockerFromWallet(amount : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can transfer to locker");
    };
    let existingWallet = switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Wallet not found") };
      case (?w) { w };
    };
    if (existingWallet.balance < amount) {
      Runtime.trap("Insufficient balance");
    };
    let updatedBalance = existingWallet.balance - amount;
    let newTransaction : Transaction = {
      id = existingWallet.transactionCounter;
      amount;
      transactionType = #lockerTransfer;
      transactionLabel = "Locker Transfer";
      note = "";
      timestamp = Time.now();
    };
    let updatedTransactions = existingWallet.transactions.concat([newTransaction]);
    let updatedWallet : Wallet = {
      existingWallet with
      balance = updatedBalance;
      transactions = updatedTransactions;
      transactionCounter = existingWallet.transactionCounter + 1;
    };
    wallets.add(caller, updatedWallet);
  };

  public shared ({ caller }) func setWalletPIN(pin : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set PIN");
    };
    let existingWallet = switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Wallet not found") };
      case (?w) { w };
    };
    let updatedWallet : Wallet = {
      existingWallet with pinHash = ?pin
    };
    wallets.add(caller, updatedWallet);
  };

  public query ({ caller }) func verifyWalletPIN(pin : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can verify PIN");
    };
    switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Wallet not found") };
      case (?w) {
        switch (w.pinHash, ?pin) {
          case (?stored, ?entered) { stored == entered };
          case (?(_), null) { false };
          case (null, _) { false };
        };
      };
    };
  };

  public shared ({ caller }) func submitBasicKYC(name : Text, dob : Text, phone : Text, aadhaarLast4 : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can submit KYC");
    };
    let existingWallet = switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Wallet not found") };
      case (?w) { w };
    };
    let details : KycDetails = {
      name;
      dob;
      phone;
      aadhaarLast4;
      address = null;
      photoIdRef = null;
    };
    let updatedWallet : Wallet = {
      existingWallet with
      kycDetails = ?details;
      kycStatus = #basic;
    };
    wallets.add(caller, updatedWallet);
  };

  public shared ({ caller }) func submitFullKYC(address : Text, photoIdRef : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can submit full KYC");
    };
    let existingWallet = switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Wallet not found") };
      case (?w) { w };
    };
    let updatedDetails = switch (existingWallet.kycDetails) {
      case (?basic) {
        {
          basic with
          address = ?address;
          photoIdRef = ?photoIdRef;
        };
      };
      case (null) { Runtime.trap("Basic KYC must be submitted first") };
    };
    let updatedWallet : Wallet = {
      existingWallet with
      kycDetails = ?updatedDetails;
      kycStatus = #full;
    };
    wallets.add(caller, updatedWallet);
  };

  public query ({ caller }) func getWalletBalance() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };
    switch (wallets.get(caller)) {
      case (null) { 0 };
      case (?w) { w.balance };
    };
  };

  public query ({ caller }) func getWalletTransactions() : async [Transaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view wallet transactions");
    };
    switch (wallets.get(caller)) {
      case (null) { [] };
      case (?w) { w.transactions };
    };
  };

  public query ({ caller }) func getKYCStatus() : async KycStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view KYC status");
    };
    switch (wallets.get(caller)) {
      case (null) { #none };
      case (?w) { w.kycStatus };
    };
  };

  public query ({ caller }) func getWalletProfile() : async WalletProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view wallet profile");
    };
    switch (wallets.get(caller)) {
      case (null) {
        {
          balance = 0;
          kycStatus = #none;
          hasPin = false;
        };
      };
      case (?w) {
        {
          balance = w.balance;
          kycStatus = w.kycStatus;
          hasPin = w.pinHash != null;
        };
      };
    };
  };

  // ── Admin Functions ─────────────────────────────
  public query ({ caller }) func getAllWalletSummaries() : async ([WalletSummary], SystemStats) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can access all wallet summaries");
    };

    var totalBalance = 0 : Nat;
    var basicKycCount = 0 : Nat;
    var fullKycCount = 0 : Nat;

    let summaries = wallets.toArray().map(
      func((principal, wallet)) {
        totalBalance += wallet.balance;
        switch (wallet.kycStatus) {
          case (#basic) { basicKycCount += 1 };
          case (#full) { fullKycCount += 1 };
          case (#none) {};
        };
        {
          principal;
          balance = wallet.balance;
          kycStatus = wallet.kycStatus;
          transactionCount = wallet.transactions.size();
        };
      }
    );

    let stats : SystemStats = {
      totalUsers = wallets.size();
      totalBalance;
      basicKycCount;
      fullKycCount;
    };

    (summaries, stats);
  };
};

