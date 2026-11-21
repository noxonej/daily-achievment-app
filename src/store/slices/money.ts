/** Reducer slice: Money: accounts, spending, savings goals, budget, bills, crypto and wishes. Returns undefined for actions it doesn't handle. */
import { safeLink } from '../../lib/url';
import type { AppState, MoneyKind, WishItem } from '../../lib/types';
import {  todayKey } from '../../lib/date';
import {  moneyId } from '../../lib/money';
import type { Action } from '../actions';
import {  withMoney, adjustAccount, isOwnFund } from '../state';

export function moneySlice(state: AppState, action: Action): AppState | undefined {
  switch (action.type) {
    case 'MONEY_SETUP': {
      const names: Record<MoneyKind, string> = { spending: 'Wallet', savings: 'Savings', investing: 'Investments' };
      return withMoney(state, (m) => ({
        ...m,
        currency: action.currency,
        setupDone: true,
        accounts: (['spending', 'savings', 'investing'] as MoneyKind[]).map((kind) => ({
          id: moneyId('acct'),
          name: names[kind],
          kind,
          amount: Math.max(0, action.amounts[kind] || 0),
        })),
      }));
    }


    case 'MONEY_SET_CURRENCY':
      return withMoney(state, (m) => ({ ...m, currency: action.currency }));


    case 'MONEY_UPSERT_ACCOUNT': {
      const { id, ...rest } = action.account;
      const name = rest.name.trim() || 'Account';
      return withMoney(state, (m) => ({
        ...m,
        setupDone: true,
        accounts: id
          ? m.accounts.map((a) => (a.id === id ? { ...a, ...rest, name } : a))
          : [...m.accounts, { ...rest, name, id: moneyId('acct') }],
      }));
    }


    case 'MONEY_DELETE_ACCOUNT':
      return withMoney(state, (m) => ({
        ...m,
        accounts: m.accounts.filter((a) => a.id !== action.accountId),
        goals: m.goals.filter((g) => g.accountId !== action.accountId),
      }));


    case 'MONEY_TRANSFER': {
      if (action.amount <= 0 || action.fromId === action.toId) return state;
      return withMoney(state, (m) => ({
        ...m,
        accounts: adjustAccount(adjustAccount(m.accounts, action.fromId, -action.amount), action.toId, action.amount),
      }));
    }


    case 'MONEY_ADD_EXPENSE': {
      if (action.amount <= 0) return state;
      return withMoney(state, (m) => ({
        ...m,
        accounts: adjustAccount(m.accounts, action.accountId, -action.amount),
        expenses: [
          ...m.expenses,
          {
            id: moneyId('exp'),
            date: todayKey(),
            amount: action.amount,
            categoryId: action.categoryId,
            accountId: action.accountId,
            note: action.note?.trim() || undefined,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    }


    case 'MONEY_DELETE_EXPENSE': {
      return withMoney(state, (m) => {
        const exp = m.expenses.find((e) => e.id === action.expenseId);
        if (!exp) return m;
        return {
          ...m,
          accounts: adjustAccount(m.accounts, exp.accountId, exp.amount),
          expenses: m.expenses.filter((e) => e.id !== action.expenseId),
        };
      });
    }


    case 'MONEY_UPSERT_GOAL': {
      return withMoney(state, (m) => {
        let accounts = m.accounts;
        let accountId = action.goal.accountId;
        if (action.newAccount) {
          accountId = moneyId('acct');
          // Money moved in from an existing account leaves that account, so the total isn't counted twice.
          if (action.newAccount.fromAccountId) {
            accounts = adjustAccount(accounts, action.newAccount.fromAccountId, -Math.max(0, action.newAccount.amount));
          }
          accounts = [
            ...accounts,
            { id: accountId, name: action.newAccount.name.trim() || 'Goal fund', kind: 'savings', amount: Math.max(0, action.newAccount.amount) },
          ];
        }
        if (!accountId || !accounts.some((a) => a.id === accountId)) return m;
        const { id, ...rest } = action.goal;
        const goal = { ...rest, name: rest.name.trim() || 'Goal', accountId };
        const goals = id
          ? m.goals.map((g) => (g.id === id ? { ...g, ...goal } : g))
          : [...m.goals, { ...goal, id: moneyId('goal'), createdAt: new Date().toISOString() }];
        return { ...m, accounts, goals };
      });
    }


    case 'MONEY_DELETE_GOAL':
      return withMoney(state, (m) => {
        const goal = m.goals.find((g) => g.id === action.goalId);
        const goals = m.goals.filter((g) => g.id !== action.goalId);
        if (!goal || !action.closeFund || !isOwnFund(m, goal)) return { ...m, goals };
        // The goal had its own fund: close it so it doesn't linger in Accounts, and move the
        // money into another savings account (or spending) so none of it disappears.
        const fund = m.accounts.find((a) => a.id === goal.accountId)!;
        const others = m.accounts.filter((a) => a.id !== fund.id);
        const home = others.find((a) => a.kind === 'savings') ?? others.find((a) => a.kind === 'spending') ?? others[0];
        if (!home) return { ...m, goals };
        const accounts = adjustAccount(others, home.id, fund.amount);
        return { ...m, goals, accounts };
      });


    case 'MONEY_SET_GOAL_SAVED':
      return withMoney(state, (m) => {
        const goal = m.goals.find((g) => g.id === action.goalId);
        if (!goal) return m;
        return { ...m, accounts: m.accounts.map((a) => (a.id === goal.accountId ? { ...a, amount: Math.max(0, Math.round(action.amount)) } : a)) };
      });


    case 'MONEY_SET_CATEGORIES':
      return withMoney(state, (m) => ({ ...m, categories: action.categories }));


    case 'MONEY_UPSERT_CRYPTO': {
      const h = action.holding;
      if (!h.coinId || !(h.amount >= 0)) return state;
      return withMoney(state, (m) => {
        const list = m.crypto ?? [];
        const id = h.id ?? moneyId('coin');
        const item = { ...h, id };
        return { ...m, crypto: list.some((c) => c.id === id) ? list.map((c) => (c.id === id ? item : c)) : [...list, item] };
      });
    }


    case 'MONEY_DELETE_CRYPTO':
      return withMoney(state, (m) => ({ ...m, crypto: (m.crypto ?? []).filter((c) => c.id !== action.holdingId) }));


    case 'MONEY_SET_CRYPTO_PRICES':
      return withMoney(state, (m) => ({ ...m, cryptoPrices: action.prices }));


    case 'MONEY_UPSERT_BILL': {
      const b = action.bill;
      if (!b.name.trim() || !(b.amount > 0)) return state;
      return withMoney(state, (m) => {
        const list = m.bills ?? [];
        const id = b.id ?? moneyId('bill');
        const item = { ...b, id, name: b.name.trim(), day: Math.min(31, Math.max(1, Math.round(b.day || 1))) };
        return { ...m, bills: list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? item : x)) : [...list, item] };
      });
    }


    case 'MONEY_SET_MODE':
      return withMoney(state, (m) => ({ ...m, mode: action.mode, saveRate: Math.min(0.9, Math.max(0, action.saveRate)) }));


    case 'MONEY_SET_INCOME':
      return withMoney(state, (m) => ({ ...m, income: action.income, saveRate: action.saveRate ?? m.saveRate }));


    case 'MONEY_SET_ASSIGNED':
      return withMoney(state, (m) => ({
        ...m,
        categories: m.categories.map((c) => {
          const v = action.assigned[c.id];
          if (v === undefined) return c;
          return { ...c, monthly: v > 0 ? Math.round(v) : undefined };
        }),
      }));


    case 'MONEY_UPSERT_WISH': {
      const w = action.wish;
      if (!w.name.trim() || !(w.price > 0)) return state;
      return withMoney(state, (m) => {
        const list = m.wishlist ?? [];
        const old = w.id ? list.find((x) => x.id === w.id) : undefined;
        const link = safeLink(w.link);
        const item: WishItem = { id: old?.id ?? moneyId('wish'), name: w.name.trim(), price: Math.round(w.price), icon: w.icon || '🎁', link, addedAt: old?.addedAt ?? todayKey() };
        return { ...m, wishlist: old ? list.map((x) => (x.id === old.id ? item : x)) : [...list, item] };
      });
    }


    case 'MONEY_DELETE_WISH':
      return withMoney(state, (m) => ({ ...m, wishlist: (m.wishlist ?? []).filter((x) => x.id !== action.wishId) }));


    case 'MONEY_DELETE_BILL':
      return withMoney(state, (m) => ({ ...m, bills: (m.bills ?? []).filter((x) => x.id !== action.billId) }));

    default:
      return undefined;
  }
}
