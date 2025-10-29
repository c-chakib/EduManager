import { TestBed } from '@angular/core/testing';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoggerService } from '../core/services/logger.service';
import { HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'isAuthenticated', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    loggerSpy = jasmine.createSpyObj('LoggerService', ['debug', 'warn', 'error']);

      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: authServiceSpy },
          { provide: Router, useValue: routerSpy },
          { provide: LoggerService, useValue: loggerSpy },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
          },
          AuthInterceptor
        ]
    });
    interceptor = TestBed.inject(AuthInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add Authorization header for API requests with token', () => {
    authServiceSpy.getToken.and.returnValue('test-token');
    const req = new HttpRequest('GET', 'http://localhost:3000/api/test');
    const next: HttpHandler = {
      handle: (request: HttpRequest<any>) => {
        expect(request.headers.get('Authorization')).toBe('Bearer test-token');
        return of({} as HttpEvent<any>);
      }
    };
    interceptor.intercept(req, next).subscribe();
  });

  it('should not add Authorization header for login/register requests', () => {
    authServiceSpy.getToken.and.returnValue('test-token');
    const req = new HttpRequest('GET', 'http://localhost:3000/users/login');
    const next: HttpHandler = {
      handle: (request: HttpRequest<any>) => {
        expect(request.headers.get('Authorization')).toBeNull();
        return of({} as HttpEvent<any>);
      }
    };
    interceptor.intercept(req, next).subscribe();
  });

  it('should call logout and navigate on 401 error', (done) => {
    authServiceSpy.getToken.and.returnValue('test-token');
    authServiceSpy.isAuthenticated.and.returnValue(true);
    const req = new HttpRequest('GET', 'http://localhost:3000/api/test');
    const next: HttpHandler = {
      handle: () => {
        return of({} as HttpEvent<any>);
      }
    };
    const errorResponse = { status: 401 } as any;
    spyOn(next, 'handle').and.returnValue(throwError(() => errorResponse));
    interceptor.intercept(req, next).subscribe({
      error: () => {
        expect(authServiceSpy.logout).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
        done();
      }
    });
  });
});
