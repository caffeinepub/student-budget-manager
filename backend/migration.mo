import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Principal "mo:core/Principal";

module {
  type IncomeSource = {
    name : Text;
    amount : Float;
  };

  type BudgetAllocation = {
    spendingPct : Float;
    savingPct : Float;
    investingPct : Float;
  };

  type Expense = {
    amount : Float;
    category : Text;
    date : Int;
    note : Text;
  };

  type SavingsGoal = {
    name : Text;
    targetAmount : Float;
    currentAmount : Float;
    deadline : Int;
    locked : Bool;
  };

  type UnlockCondition = {
    #goalMet : Nat;
    #timePeriod : Int;
  };

  type DigitalLocker = {
    locked : Bool;
    conditionType : ?UnlockCondition;
    unlockDate : ?Int;
  };

  type UserProfile = {
    displayName : Text;
  };

  type Profile = {
    userProfile : UserProfile;
    incomeSources : [IncomeSource];
    allocation : BudgetAllocation;
    expenses : [Expense];
    savingsGoals : [SavingsGoal];
    digitalLocker : DigitalLocker;
  };

  type CompleteProfile = {
    profile : Profile;
  };

  // ── Wallet and KYC ─────────────────────────────
  type KycStatus = {
    #none;
    #basic;
    #full;
  };

  type KycDetails = {
    name : Text;
    dob : Text;
    phone : Text;
    aadhaarLast4 : Text;
    address : ?Text;
    photoIdRef : ?Text;
  };

  type TransactionType = {
    #credit;
    #debit;
    #lockerTransfer;
  };

  type Transaction = {
    id : Nat;
    amount : Nat;
    transactionType : TransactionType;
    transactionLabel : Text;
    note : Text;
    timestamp : Int;
  };

  type Wallet = {
    balance : Nat;
    pinHash : ?Text;
    kycStatus : KycStatus;
    kycDetails : ?KycDetails;
    transactions : [Transaction];
    transactionCounter : Nat;
  };

  type OldActor = {
    profiles : Map.Map<Principal, CompleteProfile>;
  };

  type NewActor = {
    profiles : Map.Map<Principal, CompleteProfile>;
    wallets : Map.Map<Principal, Wallet>;
  };

  public func run(old : OldActor) : NewActor {
    { old with wallets = Map.empty<Principal, Wallet>() };
  };
};

