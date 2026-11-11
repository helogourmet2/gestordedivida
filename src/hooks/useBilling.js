import { useContext } from 'react';
import { BillingContext } from '../lib/billingContext';
export function useBilling() { return useContext(BillingContext); }
