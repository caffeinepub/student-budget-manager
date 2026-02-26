import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  Profile, Expense, SavingsGoal, DigitalLocker, UserProfile,
  Transaction, WalletProfile, KycStatus, WalletSummary, SystemStats,
} from '../backend';

// ── User Profile ─────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── Profile ──────────────────────────────────────────────────────

export function useGetProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Profile | null>({
    queryKey: ['profile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      try {
        return await actor.getProfile(identity.getPrincipal());
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// ── Income ───────────────────────────────────────────────────────

export function useAddIncome() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, amount }: { name: string; amount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addIncome(name, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── Allocation ───────────────────────────────────────────────────

export function useSetAllocationSplit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spending,
      saving,
      investing,
    }: {
      spending: number;
      saving: number;
      investing: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (Math.round(spending + saving + investing) !== 100) {
        throw new Error('Allocation percentages must sum to 100');
      }
      return actor.setAllocationSplit(spending, saving, investing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── Expenses ─────────────────────────────────────────────────────

export function useGetExpenses() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      category,
      note,
    }: {
      amount: number;
      category: string;
      note: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExpense(amount, category, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// ── Savings Goals ─────────────────────────────────────────────────

export function useGetSavingsGoals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SavingsGoal[]>({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSavingsGoals();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddSavingsGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      target,
      deadline,
    }: {
      name: string;
      target: number;
      deadline: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSavingsGoal(name, target, deadline);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });
}

export function useUpdateSavingsGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ index, amount }: { index: bigint; amount: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSavingsGoal(index, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });
}

// ── Digital Locker ────────────────────────────────────────────────

export function useGetLockerStatus() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DigitalLocker | null>({
    queryKey: ['lockerStatus'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLockerStatus();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useRequestUnlock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conditionType,
      goalIndex,
      periodDays,
    }: {
      conditionType: string;
      goalIndex: bigint | null;
      periodDays: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestUnlock(conditionType, goalIndex, periodDays);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockerStatus'] });
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
    },
  });
}

// ── Investment Suggestions ────────────────────────────────────────

export function useGetInvestmentSuggestions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[string, number][]>({
    queryKey: ['investmentSuggestions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInvestmentSuggestions();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ── Wallet ────────────────────────────────────────────────────────

const WALLET_QUERY_KEYS = ['walletProfile', 'walletBalance', 'walletTransactions', 'kycStatus'];

function invalidateWalletQueries(queryClient: ReturnType<typeof useQueryClient>) {
  WALLET_QUERY_KEYS.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}

export function useGetWalletProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WalletProfile>({
    queryKey: ['walletProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getWalletProfile();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetWalletBalance() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getWalletBalance();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetWalletTransactions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['walletTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWalletTransactions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetKYCStatus() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<KycStatus>({
    queryKey: ['kycStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getKYCStatus();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.createWallet();
    },
    onSuccess: () => {
      invalidateWalletQueries(queryClient);
    },
  });
}

export function useAddFundsToWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, transactionLabel }: { amount: bigint; transactionLabel: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFundsToWallet(amount, transactionLabel);
    },
    onSuccess: () => {
      invalidateWalletQueries(queryClient);
    },
  });
}

export function useDeductFromWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, transactionLabel }: { amount: bigint; transactionLabel: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deductFromWallet(amount, transactionLabel);
    },
    onSuccess: () => {
      invalidateWalletQueries(queryClient);
    },
  });
}

export function useTransferToLockerFromWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount }: { amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.transferToLockerFromWallet(amount);
    },
    onSuccess: () => {
      invalidateWalletQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['lockerStatus'] });
    },
  });
}

export function useSetWalletPIN() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pin }: { pin: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setWalletPIN(pin);
    },
    onSuccess: () => {
      invalidateWalletQueries(queryClient);
    },
  });
}

export function useVerifyWalletPIN() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ pin }: { pin: string }): Promise<boolean> => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyWalletPIN(pin);
    },
  });
}

export function useSubmitBasicKYC() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      dob,
      phone,
      aadhaarLast4,
    }: {
      name: string;
      dob: string;
      phone: string;
      aadhaarLast4: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitBasicKYC(name, dob, phone, aadhaarLast4);
    },
    onSuccess: () => {
      invalidateWalletQueries(queryClient);
    },
  });
}

export function useSubmitFullKYC() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, photoIdRef }: { address: string; photoIdRef: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitFullKYC(address, photoIdRef);
    },
    onSuccess: () => {
      invalidateWalletQueries(queryClient);
    },
  });
}

// ── Admin ─────────────────────────────────────────────────────────

export function useGetAllWalletSummaries() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[WalletSummary[], SystemStats] | null>({
    queryKey: ['allWalletSummaries'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getAllWalletSummaries();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Unauthorized') || msg.includes('Only admins')) {
          throw new Error('UNAUTHORIZED');
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}
