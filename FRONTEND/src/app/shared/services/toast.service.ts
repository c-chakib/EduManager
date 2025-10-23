import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  title?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  closable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  show(toast: Omit<Toast, 'id'>): void {
    const id = this.generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      closable: toast.closable ?? true
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => this.remove(id), newToast.duration);
    }
  }

  success(message: string, title?: string, duration?: number): void {
    this.show({ message, title, variant: 'success', duration });
  }

  error(message: string, title?: string, duration?: number): void {
    this.show({ message, title, variant: 'error', duration });
  }

  warning(message: string, title?: string, duration?: number): void {
    this.show({ message, title, variant: 'warning', duration });
  }

  info(message: string, title?: string, duration?: number): void {
    this.show({ message, title, variant: 'info', duration });
  }

  remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
