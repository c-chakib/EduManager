import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsEtudiantsComponent } from './details-etudiants.component';

describe('DetailsEtudiantsComponent', () => {
  let component: DetailsEtudiantsComponent;
  let fixture: ComponentFixture<DetailsEtudiantsComponent>;

  beforeEach(async () => {
      await TestBed.configureTestingModule({
  declarations: [ DetailsEtudiantsComponent ],
  imports: [ HttpClientTestingModule ],
       providers: [ { provide: ActivatedRoute, useValue: { snapshot: { data: { studentData: {} }, params: { id: '1' } } } } ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsEtudiantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
