import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Centralized logging service
 * - Respects environment configuration
 * - Provides consistent logging format
 * - Easy to extend for remote logging
 * - Can be disabled in production
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly enabled = environment.logging.enabled;
  private readonly logLevel = environment.logging.level;
  
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.logLevel as LogLevel];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return data ? `${prefix} ${message}` : `${prefix} ${message}`;
  }

  debug(message: string, ...data: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...data);
    }
  }

  info(message: string, ...data: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...data);
    }
  }

  warn(message: string, ...data: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...data);
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error);
      
      // In production, you could send errors to a remote logging service
      // if (environment.production) {
      //   this.sendToRemoteLogger(message, error);
      // }
    }
  }

  // Group related logs
  group(groupName: string): void {
    if (this.enabled) {
      console.group(groupName);
    }
  }

  groupEnd(): void {
    if (this.enabled) {
      console.groupEnd();
    }
  }

  // Measure performance
  time(label: string): void {
    if (this.enabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.enabled) {
      console.timeEnd(label);
    }
  }
}
