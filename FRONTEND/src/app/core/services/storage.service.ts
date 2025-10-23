import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Storage Service - Abstraction layer for browser storage
 * Benefits:
 * - Easier to test (can mock)
 * - Centralized error handling
 * - Type-safe operations
 * - Easy to migrate to other storage mechanisms
 * - Potential for encryption/security layer
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TOKEN_KEY = environment.auth.tokenKey;
  private readonly USER_KEY = environment.auth.userKey;
  private readonly ROLE_KEY = 'role';
  /**
   * Get user role from storage
   */
  getRole(): 'admin' | 'user' | null {
    return (this.getItem(this.ROLE_KEY) as 'admin' | 'user') ?? null;
  }

  /**
   * Set user role in storage
   */
  setRole(role: 'admin' | 'user'): boolean {
    return this.setItem(this.ROLE_KEY, role);
  }

  /**
   * Get an item from storage
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from storage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Set an item in storage
   */
  setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to storage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Remove an item from storage
   */
  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (key: ${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   */
  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get typed object from storage
   */
  getObject<T>(key: string): T | null {
    try {
      const item = this.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing object from storage (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Set typed object in storage
   */
  setObject<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      return this.setItem(key, serialized);
    } catch (error) {
      console.error(`Error serializing object to storage (key: ${key}):`, error);
      return false;
    }
  }

  // Authentication-specific methods
  getToken(): string | null {
    return this.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): boolean {
    return this.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): boolean {
    return this.removeItem(this.TOKEN_KEY);
  }

  getUser<T>(): T | null {
    return this.getObject<T>(this.USER_KEY);
  }

  setUser<T>(user: T): boolean {
    return this.setObject(this.USER_KEY, user);
  }

  removeUser(): boolean {
    return this.removeItem(this.USER_KEY);
  }

  clearAuthData(): boolean {
    // Also clear any derived auth metadata such as role
    this.removeItem(this.ROLE_KEY);
    return this.removeToken() && this.removeUser();
  }
}
