import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { concatMap } from 'rxjs';

interface ExpenseDto {
  id: number;
  category: string;
  merchant: string;
  totalPrice: {
    amount: number;
    currency: string;
  };
}
interface ExpensesStoreState {
  expenses: ExpenseDto[];
}
const DEFAULT_STATE = {
  expenses: [],
};
@Injectable({
  providedIn: 'root',
})
export class ExpensesStore extends ComponentStore<ExpensesStoreState> {
  private readonly httpClient = inject(HttpClient);

  readonly expenses$ = this.select((s) => s.expenses);
  constructor() {
    super(DEFAULT_STATE);
    this.getExpenses();
  }

  loadExpenses = this.updater((state, expenses: ExpenseDto[]) => ({
    expenses: [...state.expenses, ...expenses],
  }));

  readonly getExpenses = this.effect<void>(($) =>
    $.pipe(
      concatMap(() => this.httpClient.get<ExpenseDto[]>('api/expenses')),
      tapResponse(
        (expenses) => this.loadExpenses(expenses),
        (error) => this.handleError(error)
      )
    )
  );

  readonly handleError = (error: unknown) => console.log(error);
}
