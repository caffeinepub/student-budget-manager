import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

module {
  // Redeclare UnlockCondition type
  type UnlockCondition = {
    #goalMet : Nat;
    #timePeriod : Int;
  };

  type OldLocker = {
    locked : Bool;
    conditionType : ?UnlockCondition;
    unlockDate : ?Int;
  };

  type OldProfile = {
    userProfile : {
      displayName : Text;
    };
    incomeSources : [{
      name : Text;
      amount : Float;
    }];
    allocation : {
      spendingPct : Float;
      savingPct : Float;
      investingPct : Float;
    };
    expenses : [{
      amount : Float;
      category : Text;
      date : Int;
      note : Text;
    }];
    savingsGoals : [{
      name : Text;
      targetAmount : Float;
      currentAmount : Float;
      deadline : Int;
      locked : Bool;
    }];
    digitalLocker : OldLocker;
  };

  type OldWalletTransaction = {
    id : Nat;
    amount : Float;
    senderLabel : ?Text;
    timestamp : Int;
    note : Text;
  };

  type OldWallet = {
    balance : Float;
    transactions : [OldWalletTransaction];
    transfers : [{
      id : Nat;
      amount : Float;
      destination : Text;
      timestamp : Int;
      note : Text;
    }];
  };

  type OldCompleteProfile = {
    profile : OldProfile;
    wallet : OldWallet;
  };

  type OldActor = {
    profiles : Map.Map<Principal, OldCompleteProfile>;
    nextTransactionId : Nat;
    nextTransferId : Nat;
  };

  // New wallet transaction type with recipientLabel and transactionType
  type NewWalletTransaction = {
    id : Nat;
    amount : Float;
    recipientLabel : ?Text;
    transactionType : Text;
    timestamp : Int;
    note : Text;
  };

  // Migration function
  public func run(old : OldActor) : {
    profiles : Map.Map<Principal, {
      profile : OldProfile;
      wallet : {
        balance : Float;
        transactions : [NewWalletTransaction];
        transfers : [{
          id : Nat;
          amount : Float;
          destination : Text;
          timestamp : Int;
          note : Text;
        }];
      };
    }>;
    nextTransactionId : Nat;
    nextTransferId : Nat;
  } {
    let newProfiles = old.profiles.map<Principal, OldCompleteProfile, {
      profile : OldProfile;
      wallet : {
        balance : Float;
        transactions : [NewWalletTransaction];
        transfers : [{
          id : Nat;
          amount : Float;
          destination : Text;
          timestamp : Int;
          note : Text;
        }];
      };
    }>(
      func(_principal, oldProfile) {
        // Migrate wallet transactions
        let newTransactions = oldProfile.wallet.transactions.map(
          func(oldTx) {
            {
              id = oldTx.id;
              amount = oldTx.amount;
              recipientLabel = oldTx.senderLabel; // Rename senderLabel to recipientLabel
              transactionType = "legacy";
              timestamp = oldTx.timestamp;
              note = oldTx.note;
            };
          }
        );
        {
          profile = oldProfile.profile;
          wallet = {
            balance = oldProfile.wallet.balance;
            transactions = newTransactions;
            transfers = oldProfile.wallet.transfers;
          };
        };
      }
    );
    {
      profiles = newProfiles;
      nextTransactionId = old.nextTransactionId;
      nextTransferId = old.nextTransferId;
    };
  };
};
