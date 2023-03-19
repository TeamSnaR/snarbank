import { NxWelcomeComponent } from './nx-welcome.component';
import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'snarbank-root',
  template: ` <snarbank-nx-welcome></snarbank-nx-welcome> `,
  styles: [],
})
export class AppComponent {
  title = 'admin-app';
}
