import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminApprovalsComponent } from './admin-approvals.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminApprovalsComponent', () => {
  let component: AdminApprovalsComponent;
  let fixture: ComponentFixture<AdminApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminApprovalsComponent],
      imports: [RouterTestingModule, HttpClientTestingModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add more tests for approval logic as needed
});
