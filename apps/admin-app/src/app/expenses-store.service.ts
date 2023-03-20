import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { ExpenseDto } from '@snarbank/generated/admin-api-types';
import { concatMap } from 'rxjs';

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
