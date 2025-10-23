import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Base class for components that need proper subscription management
 * Usage: extend this class and use takeUntil(this.destroy$) on all subscriptions
 * 
 * Example:
 * export class MyComponent extends SubscriptionManager implements OnInit {
 *   ngOnInit() {
 *     this.myService.getData()
 *       .pipe(takeUntil(this.destroy$))
 *       .subscribe(data => ...);
 *   }
 * }
 */
@Injectable()
export abstract class SubscriptionManager implements OnDestroy {
  protected destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
