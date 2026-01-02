export type AccountType = 'credit_card' | 'loan' | 'mortgage' | 'other';

export interface BalanceEntry {
  date: string; // YYYY-MM-DD
  balance: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  interestRate: number; // Percentage, e.g., 24.99
  history: BalanceEntry[];
}

export interface AppState {
  accounts: Account[];
}

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Chase Sapphire',
    type: 'credit_card',
    interestRate: 24.99,
    history: [
      { date: '2023-01-01', balance: 5000 },
      { date: '2023-02-01', balance: 4800 },
      { date: '2023-03-01', balance: 4500 },
    ]
  },
  {
    id: '2',
    name: 'Auto Loan',
    type: 'loan',
    interestRate: 5.4,
    history: [
      { date: '2023-01-01', balance: 25000 },
      { date: '2023-02-01', balance: 24600 },
      { date: '2023-03-01', balance: 24200 },
    ]
  }
];