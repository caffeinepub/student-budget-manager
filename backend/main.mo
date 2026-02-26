import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Array "mo:core/Array";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // ── Access Control ──────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Data Types ──────────────────────────────────────────────────
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

  // ── State ───────────────────────────────────────────────────────
  let profiles = Map.empty<Principal, Profile>();

  // ── Internal helpers ────────────────────────────────────────────
  func emptyProfile() : Profile {
    {
      userProfile = { displayName = "" };
      incomeSources = [];
      allocation = { spendingPct = 50.0; savingPct = 30.0; investingPct = 20.0 };
      expenses = [];
      savingsGoals = [];
      digitalLocker = { locked = true; conditionType = null; unlockDate = null };
    };
  };

  func getOrCreateProfile(user : Principal) : Profile {
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

  // ── User Profile (required by frontend) ─────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    switch (profiles.get(caller)) {
      case (?p) { ?p.userProfile };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(up : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let existing = getOrCreateProfile(caller);
    let updated : Profile = {
      userProfile = up;
      incomeSources = existing.incomeSources;
      allocation = existing.allocation;
      expenses = existing.expenses;
      savingsGoals = existing.savingsGoals;
      digitalLocker = existing.digitalLocker;
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (?p) { ?p.userProfile };
      case (null) { null };
    };
  };

  // ── Income ───────────────────────────────────────────────────────
  public shared ({ caller }) func addIncome(name : Text, amount : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add income");
    };
    let existing = getOrCreateProfile(caller);
    let newSource : IncomeSource = { name = name; amount };
    let updated : Profile = {
      userProfile = existing.userProfile;
      incomeSources = existing.incomeSources.concat([newSource]);
      allocation = existing.allocation;
      expenses = existing.expenses;
      savingsGoals = existing.savingsGoals;
      digitalLocker = existing.digitalLocker;
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getProfile(user : Principal) : async Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?p) { p };
    };
  };

  // ── Budget Allocation ────────────────────────────────────────────
  public shared ({ caller }) func setAllocationSplit(spending : Float, saving : Float, investing : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can set allocation");
    };
    if (spending + saving + investing != 100.0) {
      Runtime.trap("Allocation percentages must sum to 100");
    };
    let existing = getOrCreateProfile(caller);
    let updated : Profile = {
      userProfile = existing.userProfile;
      incomeSources = existing.incomeSources;
      allocation = { spendingPct = spending; savingPct = saving; investingPct = investing };
      expenses = existing.expenses;
      savingsGoals = existing.savingsGoals;
      digitalLocker = existing.digitalLocker;
    };
    profiles.add(caller, updated);
  };

  // ── Expenses ─────────────────────────────────────────────────────
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
    let updated : Profile = {
      userProfile = existing.userProfile;
      incomeSources = existing.incomeSources;
      allocation = existing.allocation;
      expenses = existing.expenses.concat([newExpense]);
      savingsGoals = existing.savingsGoals;
      digitalLocker = existing.digitalLocker;
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getExpenses() : async [Expense] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view expenses");
    };
    let p = getOrCreateProfile(caller);
    p.expenses;
  };

  // ── Savings Goals ────────────────────────────────────────────────
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
    let updated : Profile = {
      userProfile = existing.userProfile;
      incomeSources = existing.incomeSources;
      allocation = existing.allocation;
      expenses = existing.expenses;
      savingsGoals = existing.savingsGoals.concat([newGoal]);
      digitalLocker = existing.digitalLocker;
    };
    profiles.add(caller, updated);
  };

  public shared ({ caller }) func updateSavingsGoal(index : Nat, amount : Float) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update savings goals");
    };
    let existing = getOrCreateProfile(caller);
    if (index >= existing.savingsGoals.size()) {
      Runtime.trap("Invalid goal index");
    };

    let updatedGoals = Array.tabulate(existing.savingsGoals.size(), func(i) { if (i < existing.savingsGoals.size()) { if (i == index) { let g = existing.savingsGoals[i]; let newAmount = g.currentAmount + amount; { name = g.name; targetAmount = g.targetAmount; currentAmount = newAmount; deadline = g.deadline; locked = g.locked } } else { existing.savingsGoals[i] } } else { existing.savingsGoals[0] } });

    let updated : Profile = {
      userProfile = existing.userProfile;
      incomeSources = existing.incomeSources;
      allocation = existing.allocation;
      expenses = existing.expenses;
      savingsGoals = updatedGoals;
      digitalLocker = existing.digitalLocker;
    };
    profiles.add(caller, updated);
  };

  public query ({ caller }) func getSavingsGoals() : async [SavingsGoal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view savings goals");
    };
    let p = getOrCreateProfile(caller);
    p.savingsGoals;
  };

  // ── Digital Locker ───────────────────────────────────────────────
  public query ({ caller }) func getLockerStatus() : async DigitalLocker {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view locker status");
    };
    let p = getOrCreateProfile(caller);
    p.digitalLocker;
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
      if (index >= existing.savingsGoals.size()) {
        Runtime.trap("Invalid goal index");
      };
      let goal = existing.savingsGoals[index];
      if (goal.currentAmount >= goal.targetAmount) {
        let updatedLocker : DigitalLocker = {
          locked = false;
          conditionType = ?#goalMet(index);
          unlockDate = ?Time.now();
        };
        let updated : Profile = {
          userProfile = existing.userProfile;
          incomeSources = existing.incomeSources;
          allocation = existing.allocation;
          expenses = existing.expenses;
          savingsGoals = existing.savingsGoals;
          digitalLocker = updatedLocker;
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
      let updated : Profile = {
        userProfile = existing.userProfile;
        incomeSources = existing.incomeSources;
        allocation = existing.allocation;
        expenses = existing.expenses;
        savingsGoals = existing.savingsGoals;
        digitalLocker = updatedLocker;
      };
      profiles.add(caller, updated);
      // Check if the time period has already passed (e.g. 0 days)
      if (Time.now() >= unlockDate) {
        let unlockedLocker : DigitalLocker = {
          locked = false;
          conditionType = updatedLocker.conditionType;
          unlockDate = updatedLocker.unlockDate;
        };
        let finalUpdated : Profile = {
          userProfile = existing.userProfile;
          incomeSources = existing.incomeSources;
          allocation = existing.allocation;
          expenses = existing.expenses;
          savingsGoals = existing.savingsGoals;
          digitalLocker = unlockedLocker;
        };
        profiles.add(caller, finalUpdated);
        return true;
      };
      return true;
    };
    false;
  };

  // ── Investment Suggestions ───────────────────────────────────────
  public query ({ caller }) func getInvestmentSuggestions() : async [(Text, Float)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view investment suggestions");
    };
    let p = getOrCreateProfile(caller);
    let income = totalIncome(p.incomeSources);
    let investingAmount = income * (p.allocation.investingPct / 100.0);
    [
      ("Low-Risk Savings Account", investingAmount * 0.5),
      ("Government Bonds", investingAmount * 0.3),
      ("Index Funds", investingAmount * 0.2),
    ];
  };
};
