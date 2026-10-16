import { Routes } from '@angular/router';
import { Deck } from './deck';
import { NotesPage } from './presenter/notes-page';
import { Presenter } from './presenter/presenter';

// /3 shows slide 3, /presenter/3 the presenter page, /notes the notes only. Anything else goes to slide 1.
// `data.mode` tells Nav which of the two navigations it is serving.
export const routes: Routes = [
  { path: 'presenter', pathMatch: 'full', redirectTo: 'presenter/1' },
  { path: 'presenter/:no', component: Presenter, data: { mode: 'presenter' } },
  { path: 'notes', component: NotesPage },
  { path: ':no', component: Deck },
  { path: '**', redirectTo: '1' },
];
