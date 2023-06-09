import { Money } from './money';

export interface ExpenseDto {
  id: string;
  merchant: string;
  category: string;
  totalPrice?: Money;
  dateIncurred: string;
}
