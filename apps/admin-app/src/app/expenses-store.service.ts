import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { ExpenseDto, Money } from '@snarbank/generated/admin-api-types';
import { concatMap, map, Observable, tap } from 'rxjs';

export interface ExpenseData {
  id: string;
  merchant: string;
  category: string;
  totalPrice: Money;
  dateIncurred: Date;
}
interface ExpensesStoreState {
  expenses: ExpenseDto[];
  expenseData: ExpenseData | null;
}
const DEFAULT_STATE = {
  expenses: [],
  expenseData: null,
};

const initExpenseData = () => {
  return {
    id: 'abc',
    merchant: '',
    category: '',
    totalPrice: {
      currency: 'GBP',
      amount: 0,
    },
    dateIncurred: new Date(),
  };
};
@Injectable({
  providedIn: 'root',
})
export class ExpensesStore extends ComponentStore<ExpensesStoreState> {
  private readonly httpClient = inject(HttpClient);

  readonly expenses$ = this.select((s) => s.expenses);
  readonly expenseData$ = this.select((s) => s.expenseData);
  constructor() {
    super(DEFAULT_STATE);
    this.getExpenses();
  }

  loadExpenses = this.updater((state, expenses: ExpenseDto[]) => ({
    ...state,
    expenses: [...state.expenses, ...expenses],
  }));

  insertExpense = this.updater((state, expense: ExpenseDto) => ({
    ...state,
    expenses: [...state.expenses, expense],
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
  readonly submitExpense = this.effect(
    (expenseData$: Observable<ExpenseData>) =>
      expenseData$.pipe(
        concatMap((expenseData) =>
          this.httpClient.post<ExpenseDto>('api/expenses', expenseData)
        ),
        tapResponse(
          (expenseDto: ExpenseDto) => {
            this.patchState({ expenseData: null });
            this.insertExpense(expenseDto);
          },
          (error) => this.handleError(error)
        )
      )
  );
  readonly addExpense = () =>
    this.patchState({
      expenseData: initExpenseData(),
    });
  readonly handleError = (error: unknown) => console.log(error);
}
