import { create } from 'zustand';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string; // Visa, Mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  email?: string; // for PayPal
  isDefault: boolean;
  nickname?: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  propertyTitle: string;
  propertyImage: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: PaymentMethod;
  date: string;
  description: string;
  refundAmount?: number;
  refundDate?: string;
  splitWith?: string[]; // User IDs if split payment
}

export interface SplitPayment {
  id: string;
  bookingId: string;
  totalAmount: number;
  splits: {
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    paidAt?: string;
  }[];
  createdAt: string;
}

interface PaymentState {
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  splitPayments: SplitPayment[];
  loadPaymentData: () => void;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => void;
  deletePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  requestRefund: (transactionId: string, amount: number) => void;
  createSplitPayment: (split: Omit<SplitPayment, 'id'>) => void;
  updateSplitPaymentStatus: (splitId: string, userId: string, status: 'paid' | 'failed') => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  paymentMethods: [],
  transactions: [],
  splitPayments: [],

  loadPaymentData: () => {
    // Simulate loading payment data
    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: 'pm-1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
        nickname: 'Personal Card',
      },
      {
        id: 'pm-2',
        type: 'card',
        last4: '5555',
        brand: 'Mastercard',
        expiryMonth: 8,
        expiryYear: 2026,
        isDefault: false,
      },
      {
        id: 'pm-3',
        type: 'bank',
        bankName: 'Chase Bank',
        last4: '1234',
        isDefault: false,
      },
    ];

    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        bookingId: 'booking-1',
        propertyTitle: 'Modern Studio in Downtown',
        propertyImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        amount: 5400,
        currency: 'USD',
        status: 'completed',
        paymentMethod: mockPaymentMethods[0],
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: '3 month booking - Modern Studio',
      },
      {
        id: 'tx-2',
        bookingId: 'booking-2',
        propertyTitle: 'Cozy 2BR Near Campus',
        propertyImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        amount: 14400,
        currency: 'USD',
        status: 'completed',
        paymentMethod: mockPaymentMethods[1],
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        description: '6 month booking - Cozy 2BR',
      },
      {
        id: 'tx-3',
        bookingId: 'booking-3',
        propertyTitle: 'Luxury Apartment Downtown',
        propertyImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        amount: 3200,
        currency: 'USD',
        status: 'refunded',
        paymentMethod: mockPaymentMethods[0],
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        description: '1 month booking - Cancelled',
        refundAmount: 3200,
        refundDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    set({
      paymentMethods: mockPaymentMethods,
      transactions: mockTransactions,
    });
  },

  addPaymentMethod: (method) => {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pm-${Date.now()}`,
    };
    set((state) => ({
      paymentMethods: [...state.paymentMethods, newMethod],
    }));
  },

  updatePaymentMethod: (id, updates) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.map(pm =>
        pm.id === id ? { ...pm, ...updates } : pm
      ),
    }));
  },

  deletePaymentMethod: (id) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.filter(pm => pm.id !== id),
    }));
  },

  setDefaultPaymentMethod: (id) => {
    set((state) => ({
      paymentMethods: state.paymentMethods.map(pm => ({
        ...pm,
        isDefault: pm.id === id,
      })),
    }));
  },

  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `tx-${Date.now()}`,
    };
    set((state) => ({
      transactions: [newTransaction, ...state.transactions],
    }));
  },

  requestRefund: (transactionId, amount) => {
    set((state) => ({
      transactions: state.transactions.map(tx =>
        tx.id === transactionId
          ? {
              ...tx,
              status: amount === tx.amount ? 'refunded' : 'partially_refunded',
              refundAmount: amount,
              refundDate: new Date().toISOString(),
            }
          : tx
      ),
    }));
  },

  createSplitPayment: (split) => {
    const newSplit: SplitPayment = {
      ...split,
      id: `split-${Date.now()}`,
    };
    set((state) => ({
      splitPayments: [...state.splitPayments, newSplit],
    }));
  },

  updateSplitPaymentStatus: (splitId, userId, status) => {
    set((state) => ({
      splitPayments: state.splitPayments.map(sp =>
        sp.id === splitId
          ? {
              ...sp,
              splits: sp.splits.map(s =>
                s.userId === userId
                  ? { ...s, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined }
                  : s
              ),
            }
          : sp
      ),
    }));
  },
}));
