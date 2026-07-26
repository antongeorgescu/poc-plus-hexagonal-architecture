import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** UI — Frameworks & drivers ring. Root shell. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
