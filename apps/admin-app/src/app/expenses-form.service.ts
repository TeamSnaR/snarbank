import { Injectable, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ExpenseData, ExpensesStore } from './expenses-store.service';
import { Observable, map } from 'rxjs';

export function PriceMustBeGreaterThanZeroValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const lessThanOrEqualZero = control.value <= 0;
    return lessThanOrEqualZero
      ? { lessThanOrEqualZero: { value: control.value } }
      : null;
  };
}
export interface ExpenseForm {
  merchant: FormControl<string>;
  category: FormControl<string>;
  price: FormControl<number>;
  dateIncurred: FormControl<string>;
}
@Injectable({
  providedIn: 'root',
})
export class ExpensesFormService {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly expensesStore = inject(ExpensesStore);
  categories = ['Housing', 'Transportation', 'Food', 'Groceries'];
  merchants = ['Lidl', 'Sainsbury', 'Tesco', 'Coop'];
  expenseForm$: Observable<FormGroup | null> =
    this.expensesStore.expenseData$.pipe(
      map((expenseData: ExpenseData | null) => {
        return this.initForm(expenseData);
      })
    );
  readonly initForm = (expenseData: ExpenseData | null) => {
    if (!expenseData) {
      return null;
    }
    return this.formBuilder.group<ExpenseForm>({
      merchant: this.formBuilder.control(expenseData.merchant, [
        Validators.required,
      ]),
      category: this.formBuilder.control(expenseData.category, [
        Validators.required,
      ]),
      price: this.formBuilder.control(expenseData.totalPrice.amount, [
        Validators.required,
        PriceMustBeGreaterThanZeroValidator(),
      ]),
      dateIncurred: this.formBuilder.control(
        expenseData.dateIncurred.toDateString(),
        [Validators.required]
      ),
    });
  };
  readonly submitExpense = (expenseForm: FormGroup): ExpenseData | null => {
    expenseForm.markAllAsTouched();
    if (expenseForm.invalid) {
      return null;
    }
    const expenseFormData = expenseForm.value;
    return {
      merchant: expenseFormData.merchant,
      category: expenseFormData.category,
      totalPrice: {
        amount: expenseFormData.price,
        currency: 'GBP',
      },
      dateIncurred: new Date(expenseFormData.dateIncurred),
    } as ExpenseData;
  };
}
