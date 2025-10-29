import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EtudiantsServiceService } from './etudiants-service.service';

describe('EtudiantsServiceService', () => {
  let service: EtudiantsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(EtudiantsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
