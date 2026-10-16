import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Deck } from './deck';
import { NotesPage } from './presenter/notes-page';
import { PrintPage } from './print/print-page';
import { Presenter } from './presenter/presenter';

// Slidev exports by opening /3?print=true; the same query on a slide address goes to /print.
const printQuery: CanActivateFn = (route) => {
  const print = route.queryParamMap.get('print');
  if (!print || print === 'false') return true;
  return inject(Router).createUrlTree(['/print'], { queryParams: route.queryParams });
};

// /3 shows slide 3, /print every slide for export, /presenter/3 the presenter page, /notes the notes only. Anything else goes to slide 1.
// `data.mode` tells Nav which of the two navigations it is serving.
export const routes: Routes = [
  { path: 'presenter', pathMatch: 'full', redirectTo: 'presenter/1' },
  { path: 'presenter/:no', component: Presenter, data: { mode: 'presenter' } },
  { path: 'notes', component: NotesPage },
  { path: 'print', component: PrintPage },
  { path: ':no', component: Deck, canActivate: [printQuery] },
  { path: '**', redirectTo: '1' },
];
