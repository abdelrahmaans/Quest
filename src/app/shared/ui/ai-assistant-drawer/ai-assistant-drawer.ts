import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon';
import { AIService, AiStructuredResponse } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-ai-assistant-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './ai-assistant-drawer.html',
  styleUrl: './ai-assistant-drawer.css',
})
export class AiAssistantDrawerComponent {
  @Input() isOpen = false;
  @Input() classId?: string;
  @Input() className?: string;
  @Input() sessionTitle?: string;
  @Output() closeDrawer = new EventEmitter<void>();

  private readonly aiService = inject(AIService);
  private readonly auth = inject(AuthService);

  readonly promptText = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly response = signal<AiStructuredResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Confirmation Modal State
  readonly confirmModalType = signal<'challenge' | 'xp' | null>(null);
  readonly isApplying = signal<boolean>(false);
  readonly actionSuccessMsg = signal<string | null>(null);

  readonly presets = [
    { label: '⚡ Give me a 10-minute challenge', text: 'Give me a 10-minute coding challenge for this session' },
    { label: '💡 How can I motivate this class?', text: 'Suggest strategies to motivate students who are falling behind' },
    { label: '🎯 Suggest XP rewards', text: 'Suggest balanced XP rewards for active participation' },
  ];

  onClose(): void {
    this.closeDrawer.emit();
  }

  setPreset(text: string): void {
    this.promptText.set(text);
    this.generate();
  }

  async generate(): Promise<void> {
    const text = this.promptText().trim();
    if (!text) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.actionSuccessMsg.set(null);

    const { data, error } = await this.aiService.getGamificationSuggestion({
      sessionContext: {
        classId: this.classId,
        className: this.className || 'General Class',
        sessionTitle: this.sessionTitle || 'Live Session',
      },
      prompt: text,
    });

    this.isLoading.set(false);

    if (error || !data) {
      this.errorMessage.set('Failed to generate AI suggestion. Please try again.');
      return;
    }

    this.response.set(data);
  }

  openConfirm(type: 'challenge' | 'xp'): void {
    this.confirmModalType.set(type);
  }

  closeConfirm(): void {
    this.confirmModalType.set(null);
  }

  async confirmAction(): Promise<void> {
    const res = this.response();
    const type = this.confirmModalType();
    if (!res || !type || !this.classId) return;

    this.isApplying.set(true);

    if (type === 'challenge') {
      const { error } = await this.aiService.applyAsChallenge(
        this.classId,
        res.title,
        res.instructions,
        res.xpReward,
        res.durationMinutes
      );

      this.isApplying.set(false);
      this.closeConfirm();

      if (!error) {
        this.actionSuccessMsg.set('✓ Challenge published successfully to Supabase!');
      } else {
        this.errorMessage.set('Failed to publish challenge to Supabase.');
      }
    } else if (type === 'xp') {
      const profile = this.auth.currentProfile();
      if (!profile) return;

      const { error } = await this.aiService.applyAsXpBonus(
        this.classId,
        profile.id,
        res.xpReward,
        res.title
      );

      this.isApplying.set(false);
      this.closeConfirm();

      if (!error) {
        this.actionSuccessMsg.set(`✓ Awarded +${res.xpReward} XP to all students in class!`);
      } else {
        this.errorMessage.set('Failed to award XP bonus.');
      }
    }
  }
}
