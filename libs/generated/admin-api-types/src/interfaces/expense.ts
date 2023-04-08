import { Money } from './money';

export interface Expense {
  id: string;
  merchant: string;
  category: string;
  totalPrice?: Money;
  dateIncurred: string;
}
