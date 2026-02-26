import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BudgetAllocation {
    savingPct: number;
    investingPct: number;
    spendingPct: number;
}
export interface IncomeSource {
    name: string;
    amount: number;
}
export interface DigitalLocker {
    unlockDate?: bigint;
    locked: boolean;
    conditionType?: UnlockCondition;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExpense(amount: number, category: string, note: string): Promise<void>;
    addIncome(name: string, amount: number): Promise<void>;
    addSavingsGoal(name: string, target: number, deadline: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpenses(): Promise<Array<Expense>>;
    getInvestmentSuggestions(): Promise<Array<[string, number]>>;
    getLockerStatus(): Promise<DigitalLocker>;
    getProfile(user: Principal): Promise<Profile>;
    getSavingsGoals(): Promise<Array<SavingsGoal>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    requestUnlock(conditionType: string, goalIndex: bigint | null, periodDays: bigint | null): Promise<boolean>;
    saveCallerUserProfile(up: UserProfile): Promise<void>;
    setAllocationSplit(spending: number, saving: number, investing: number): Promise<void>;
    updateSavingsGoal(index: bigint, amount: number): Promise<void>;
}
