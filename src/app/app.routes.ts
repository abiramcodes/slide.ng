import { Routes } from '@angular/router';
import { Deck } from './deck';

// /3 shows slide 3. Anything else goes to slide 1.
export const routes: Routes = [
  { path: ':no', component: Deck },
  { path: '**', redirectTo: '1' },
];
