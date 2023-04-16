import { RouterModule } from '@angular/router';
import { Component, inject } from '@angular/core';
import { ExpensesStore } from './expenses-store.service';
import {
  AsyncPipe,
  CurrencyPipe,
  DatePipe,
  NgFor,
  NgIf,
} from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ExpensesFormService } from './expenses-form.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    NgFor,
    NgIf,
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
  ],
  selector: 'snarbank-admin-root',
  template: `
    <h1 class="text-4xl">Welcome to Snar Bank</h1>
    <div>
      <ng-container *ngIf="expenses$ | async as expenses">
        <ul *ngIf="expenses.length > 0; else noExpenses">
          <li *ngFor="let expense of expenses">
            {{ expense.category }} {{ expense.merchant }}
            {{
              expense.totalPrice!.amount
                | currency : expense.totalPrice!.currency
            }}
            {{ expense.dateIncurred | date : 'medium' }}
            <button
              type="button"
              (click)="deleteExpense(expense.id)"
              class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Delete
            </button>
          </li>
        </ul>
        <ng-template #noExpenses>
          <p>No expenses to show.</p>
        </ng-template>
      </ng-container>
    </div>
    <button
      type="button"
      (click)="addExpense()"
      class="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      Add expense
    </button>
    <ng-container *ngIf="expenseForm$ | async as expenseForm">
      <form [formGroup]="expenseForm!" (ngSubmit)="submitExpense(expenseForm)">
        <mat-form-field appearance="fill">
          <mat-label>Choose a date</mat-label>
          <input
            matInput
            [matDatepicker]="picker"
            formControlName="dateIncurred"
          />
          <mat-hint>MM/DD/YYYY</mat-hint>
          <mat-datepicker-toggle
            matIconSuffix
            [for]="picker"
          ></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <div>
          <label for="merchant">Merchant: </label>
          <select id="merchant" formControlName="merchant">
            <option [value]="merchant" *ngFor="let merchant of merchants">
              {{ merchant }}
            </option>
          </select>
          <div
            *ngIf="
              expenseForm.get('merchant')?.invalid &&
              (expenseForm.get('merchant')?.dirty ||
                expenseForm.get('merchant')?.touched)
            "
            class="alert"
          >
            <div *ngIf="expenseForm.get('merchant')?.errors?.['required']">
              Merchant is required.
            </div>
          </div>
        </div>
        <div>
          <label for="category">Category: </label>
          <select id="category" formControlName="category">
            <option [value]="category" *ngFor="let category of categories">
              {{ category }}
            </option>
          </select>
          <div
            *ngIf="
              expenseForm.get('category')?.invalid &&
              (expenseForm.get('category')?.dirty ||
                expenseForm.get('category')?.touched)
            "
            class="alert"
          >
            <div *ngIf="expenseForm.get('category')?.errors?.['required']">
              Category is required.
            </div>
          </div>
        </div>
        <div>
          <label for="price">Price: </label>
          <input id="price" type="text" formControlName="price" />
          <div
            *ngIf="
              expenseForm.get('price')?.invalid &&
              (expenseForm.get('price')?.dirty ||
                expenseForm.get('price')?.touched)
            "
            class="alert"
          >
            <div *ngIf="expenseForm.get('price')?.errors?.['required']">
              Price is required.
            </div>
            <div
              *ngIf="expenseForm.get('price')?.errors?.['lessThanOrEqualZero']"
            >
              Price is must be greater than zero.
            </div>
          </div>
        </div>
        <button
          type="submnit"
          class="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Submit
        </button>
      </form>
    </ng-container>
  `,
  styles: [],
})
export class AppComponent {
  private readonly expensesStore = inject(ExpensesStore);
  private readonly expensesFormService = inject(ExpensesFormService);
  private readonly snackBar = inject(MatSnackBar);
  expenseForm$ = this.expensesFormService.expenseForm$;
  categories = this.expensesFormService.categories;
  merchants = this.expensesFormService.merchants;
  expenses$ = this.expensesStore.expenses$;

  addExpense() {
    this.expensesStore.addExpense();
  }

  submitExpense(expenseForm: FormGroup) {
    const expenseData = this.expensesFormService.submitExpense(expenseForm);
    if (expenseData) {
      this.expensesStore.submitExpense(expenseData);
    }
  }

  deleteExpense(expenseId: string) {
    this.expensesStore.deleteExpense(expenseId);
  }
}
