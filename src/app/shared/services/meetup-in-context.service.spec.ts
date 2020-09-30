import { TestBed } from '@angular/core/testing';

import { MeetupInContextService } from './meetup-in-context.service';

describe('MeetupInContextService', () => {
  let service: MeetupInContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeetupInContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
