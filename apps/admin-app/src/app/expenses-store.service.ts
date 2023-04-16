import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private readonly snackBar = inject(MatSnackBar);

  readonly expenses$ = this.select((s) => s.expenses);
  readonly expenseData$ = this.select((s) => s.expenseData);
  constructor() {
    super(DEFAULT_STATE);
    this.getExpenses();
  }

  private loadExpenses = this.updater((state, expenses: ExpenseDto[]) => ({
    ...state,
    expenses: [...state.expenses, ...expenses],
  }));

  private insertExpense = this.updater((state, expense: ExpenseDto) => ({
    ...state,
    expenses: [...state.expenses, expense],
  }));

  private removeExpense = this.updater((state, expenseId: string) => ({
    ...state,
    expenses: state.expenses.filter((expense) => expense.id !== expenseId),
  }));

  readonly deleteExpense = this.effect((expenseId$: Observable<string>) =>
    expenseId$.pipe(
      concatMap((expenseId) =>
        this.httpClient
          .delete(`api/expenses/${expenseId}`)
          .pipe(map(() => expenseId))
      ),
      tapResponse(
        (expenseId) => {
          this.removeExpense(expenseId);
          this.snackBar.open(`Removed expense`, '', {
            duration: 5000,
            verticalPosition: 'top',
            horizontalPosition: 'right',
          });
        },
        (error) => this.handleError(error)
      )
    )
  );

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
            this.snackBar.open(
              `Added ${expenseDto.category} from ${expenseDto.merchant}`,
              '',
              {
                duration: 5000,
                verticalPosition: 'top',
                horizontalPosition: 'right',
              }
            );
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
