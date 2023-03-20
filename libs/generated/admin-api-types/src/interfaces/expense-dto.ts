import { Money } from './money';

export interface ExpenseDto {
  id: number;
  merchant: string;
  category: string;
  totalPrice?: Money;
}
