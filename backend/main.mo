import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Array "mo:core/Array";
import List "mo:core/List";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

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

  public type WalletTransaction = {
    id : Nat;
    amount : Float;
    recipientLabel : ?Text;
    transactionType : Text;
    timestamp : Int;
    note : Text;
  };

  public type LockerTransfer = {
    id : Nat;
    amount : Float;
    destination : Text;
    timestamp : Int;
    note : Text;
  };

  public type Wallet = {
    balance : Float;
    transactions : [WalletTransaction];
    transfers : [LockerTransfer];
  };

  public type CompleteProfile = {
    profile : Profile;
    wallet : Wallet;
  };

  public type SendFundsError = {
    #insufficientFunds;
    #userNotFound;
    #other : Text;
  };

  // ── State ───────────────────────────────────────────────
  let profiles = Map.empty<Principal, CompleteProfile>();
  var nextTransactionId = 0;
  var nextTransferId = 0;

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
      wallet = {
        balance = 0.0;
        transactions = [];
        transfers = [];
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

  func convertTransactionToTuple(t : WalletTransaction) : (Int, WalletTransaction) {
    (t.timestamp, t);
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
      wallet = existing.wallet;
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
      wallet = existing.wallet;
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
      wallet = existing.wallet;
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
      wallet = existing.wallet;
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
      wallet = existing.wallet;
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
      wallet = existing.wallet;
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
          wallet = existing.wallet;
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
        wallet = existing.wallet;
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
          wallet = existing.wallet;
        };
        profiles.add(caller, finalUpdated);
        return true;
      };
      return true;
    };
    false;
  };

  // ── Wallet Functions ────────────────────────────────────
  public query ({ caller }) func getWalletBalance() : async Float {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view wallet balance");
    };
    let p = getOrCreateProfile(caller);
    p.wallet.balance;
  };

  // ── DEPRECATED: addFundsToWallet ───────────────────────
  // This function is intentionally left unimplemented (deprecated)
  // due to changes in the application design.
  // Do not call from the frontend!
  public shared ({ caller }) func addFundsToWallet(_amount : Float, _senderLabel : ?Text, _note : Text) : async () {
    Runtime.trap("addFundsToWallet function is deprecated and should not be called!");
  };

  public shared ({ caller }) func transferToLocker(amount : Float, note : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can transfer to locker");
    };
    let existing = getOrCreateProfile(caller);
    if (amount > existing.wallet.balance) {
      Runtime.trap("Insufficient wallet balance");
    };
    let newTransfer : LockerTransfer = {
      id = nextTransferId;
      amount;
      destination = "locker";
      timestamp = Time.now();
      note;
    };
    nextTransferId += 1;

    let updated : CompleteProfile = {
      profile = existing.profile;
      wallet = {
        balance = existing.wallet.balance - amount;
        transactions = existing.wallet.transactions;
        transfers = existing.wallet.transfers.concat([newTransfer]);
      };
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getWalletTransactions() : async [WalletTransaction] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    let p = getOrCreateProfile(caller);

    let transactionsList = List.fromArray<WalletTransaction>(p.wallet.transactions);

    let sortedTransactionsList = transactionsList.sort(
      func(a, b) {
        if (a.timestamp < b.timestamp) {
          #greater;
        } else if (a.timestamp > b.timestamp) {
          #less;
        } else {
          #equal;
        };
      }
    );

    sortedTransactionsList.toArray();
  };

  // ── NEW: Send Funds FROM Wallet (Scan to Send) ───────
  public shared ({ caller }) func sendFundsFromWallet(
    recipient : Text,
    amount : Float,
    note : Text,
  ) : async {
    #ok : WalletTransaction;
    #err : SendFundsError;
  } {
    // Auth check
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return #err(#other("Unauthorized: Only users can send funds"));
    };

    let senderProfile = getOrCreateProfile(caller);

    // Check sufficient funds
    if (amount > senderProfile.wallet.balance) {
      return #err(#insufficientFunds);
    };

    // Create transaction
    let transaction : WalletTransaction = {
      id = nextTransactionId;
      amount;
      recipientLabel = ?recipient;
      transactionType = "sent";
      timestamp = Time.now();
      note;
    };

    // Update sender's wallet with deduction
    let updatedSender : CompleteProfile = {
      profile = senderProfile.profile;
      wallet = {
        balance = senderProfile.wallet.balance - amount;
        transactions = senderProfile.wallet.transactions.concat([transaction]);
        transfers = senderProfile.wallet.transfers;
      };
    };

    profiles.add(caller, updatedSender);
    nextTransactionId += 1;

    #ok(transaction);
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
};
