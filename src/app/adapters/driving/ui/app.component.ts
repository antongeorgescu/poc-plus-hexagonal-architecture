import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** ADAPTERS · DRIVING · UI — Root shell (the human-facing primary adapter). */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
