import { RouterModule } from '@angular/router';
import { Component, inject } from '@angular/core';
import { ExpensesStore } from './expenses-store.service';
import { AsyncPipe, CurrencyPipe, NgFor } from '@angular/common';

@Component({
  standalone: true,
  imports: [RouterModule, AsyncPipe, NgFor, CurrencyPipe],
  selector: 'snarbank-admin-root',
  template: `
    <h1 class="text-4xl">Welcome to Snar Bank</h1>
    <ul>
      <li *ngFor="let expense of expenses$ | async">
        {{ expense.category }} {{ expense.merchant }}
        {{ expense.totalPrice.amount | currency : expense.totalPrice.currency }}
      </li>
    </ul>
  `,
  styles: [],
})
export class AppComponent {
  private readonly expensesStore = inject(ExpensesStore);
  expenses$ = this.expensesStore.expenses$;
}
