import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface IncomeSource {
    name: string;
    amount: number;
}
export interface DigitalLocker {
    unlockDate?: bigint;
    locked: boolean;
    conditionType?: UnlockCondition;
}
export interface WalletProfile {
    balance: bigint;
    kycStatus: KycStatus;
    hasPin: boolean;
}
export interface SystemStats {
    fullKycCount: bigint;
    totalUsers: bigint;
    totalBalance: bigint;
    basicKycCount: bigint;
}
export interface Profile {
    expenses: Array<Expense>;
    digitalLocker: DigitalLocker;
    userProfile: UserProfile;
    allocation: BudgetAllocation;
    savingsGoals: Array<SavingsGoal>;
    incomeSources: Array<IncomeSource>;
}
export interface Expense {
    date: bigint;
    note: string;
    category: string;
    amount: number;
}
export interface BudgetAllocation {
    savingPct: number;
    investingPct: number;
    spendingPct: number;
}
export interface Transaction {
    id: bigint;
    transactionType: TransactionType;
    transactionLabel: string;
    note: string;
    timestamp: bigint;
    amount: bigint;
}
export interface WalletSummary {
    principal: Principal;
    balance: bigint;
    kycStatus: KycStatus;
    transactionCount: bigint;
}
export type UnlockCondition = {
    __kind__: "goalMet";
    goalMet: bigint;
} | {
    __kind__: "timePeriod";
    timePeriod: bigint;
};
export interface UserProfile {
    displayName: string;
}
export interface SavingsGoal {
    name: string;
    locked: boolean;
    deadline: bigint;
    targetAmount: number;
    currentAmount: number;
}
export enum KycStatus {
    full = "full",
    none = "none",
    basic = "basic"
}
export enum TransactionType {
    lockerTransfer = "lockerTransfer",
    credit = "credit",
    debit = "debit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExpense(amount: number, category: string, note: string): Promise<void>;
    addFundsToWallet(amount: bigint, transactionLabel: string): Promise<void>;
    addIncome(name: string, amount: number): Promise<void>;
    addSavingsGoal(name: string, target: number, deadline: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createWallet(): Promise<void>;
    deductFromWallet(amount: bigint, transactionLabel: string): Promise<void>;
    getAllWalletSummaries(): Promise<[Array<WalletSummary>, SystemStats]>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpenses(): Promise<Array<Expense>>;
    getInvestmentSuggestions(): Promise<Array<[string, number]>>;
    getKYCStatus(): Promise<KycStatus>;
    getLockerStatus(): Promise<DigitalLocker>;
    getProfile(user: Principal): Promise<Profile>;
    getSavingsGoals(): Promise<Array<SavingsGoal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletBalance(): Promise<bigint>;
    getWalletProfile(): Promise<WalletProfile>;
    getWalletTransactions(): Promise<Array<Transaction>>;
    isCallerAdmin(): Promise<boolean>;
    requestUnlock(conditionType: string, goalIndex: bigint | null, periodDays: bigint | null): Promise<boolean>;
    saveCallerUserProfile(up: UserProfile): Promise<void>;
    setAllocationSplit(spending: number, saving: number, investing: number): Promise<void>;
    setWalletPIN(pin: string): Promise<void>;
    submitBasicKYC(name: string, dob: string, phone: string, aadhaarLast4: string): Promise<void>;
    submitFullKYC(address: string, photoIdRef: string): Promise<void>;
    transferToLockerFromWallet(amount: bigint): Promise<void>;
    updateSavingsGoal(index: bigint, amount: number): Promise<void>;
    verifyWalletPIN(pin: string): Promise<boolean>;
}
