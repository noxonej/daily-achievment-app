import { createContext, useContext } from 'react';
import type { Account } from '../lib/accounts';

export interface AuthValue {
  account: Account;
  update: (patch: Partial<Account>) => void;
  setPin: (pin: string | null) => Promise<void>;
  signOut: () => void;
  remove: () => void;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue | null {
  return useContext(AuthContext);
}
