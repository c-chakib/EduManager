import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeResolver implements Resolve<any> {
  resolve(): Observable<any> {
    // Replace with actual data fetching logic for home page
    return of({});
  }
}
