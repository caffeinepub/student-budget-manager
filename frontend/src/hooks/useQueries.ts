import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Profile, Expense, SavingsGoal, DigitalLocker, UserProfile, WalletTransaction } from '../backend';

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
  const { identity } = useInternetIdentity();

  return useQuery<Expense[]>({
    queryKey: ['expenses', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenses();
    },
    enabled: !!actor && !actorFetching && !!identity,
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── Savings Goals ────────────────────────────────────────────────

export function useGetSavingsGoals() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<SavingsGoal[]>({
    queryKey: ['savingsGoals', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSavingsGoals();
    },
    enabled: !!actor && !actorFetching && !!identity,
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── Digital Locker ───────────────────────────────────────────────

export function useGetLockerStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<DigitalLocker | null>({
    queryKey: ['lockerStatus', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLockerStatus();
    },
    enabled: !!actor && !actorFetching && !!identity,
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
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── Investment Suggestions ───────────────────────────────────────

export function useGetInvestmentSuggestions() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Array<[string, number]>>({
    queryKey: ['investmentSuggestions', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInvestmentSuggestions();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// ── Wallet ───────────────────────────────────────────────────────

export function useGetWalletBalance() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ['walletBalance', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getWalletBalance();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetWalletTransactions() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<WalletTransaction[]>({
    queryKey: ['walletTransactions', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWalletTransactions();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddFundsToWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      senderLabel,
      note,
    }: {
      amount: number;
      senderLabel: string | null;
      note: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFundsToWallet(amount, senderLabel, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    },
  });
}

export function useTransferToLocker() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, note }: { amount: number; note: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.transferToLocker(amount, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['lockerStatus'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSendFundsFromWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      amount,
      note,
    }: {
      recipient: string;
      amount: number;
      note: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.sendFundsFromWallet(recipient, amount, note);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'insufficientFunds') {
          throw new Error('Insufficient funds in your wallet');
        } else if (err.__kind__ === 'userNotFound') {
          throw new Error('Recipient not found');
        } else if (err.__kind__ === 'other') {
          throw new Error(err.other);
        }
        throw new Error('Failed to send funds');
      }
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    },
  });
}
