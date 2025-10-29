import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { ChatbotService } from '../services/chatbot.service';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let chatbotServiceSpy: jasmine.SpyObj<ChatbotService>;

  beforeEach(async () => {
    chatbotServiceSpy = jasmine.createSpyObj('ChatbotService', ['openChat']);
    await TestBed.configureTestingModule({
      declarations: [FooterComponent],
      providers: [
        { provide: ChatbotService, useValue: chatbotServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have current year', () => {
    expect(component.currentYear).toEqual(new Date().getFullYear());
  });

  it('should call openChatbot', () => {
    component.openChatbot();
    expect(chatbotServiceSpy.openChat).toHaveBeenCalled();
  });
});
