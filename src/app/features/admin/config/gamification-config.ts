import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

interface LevelRow {
  id: string;
  level_number: number;
  xp_required: number;
  title: string | null;
}

@Component({
  selector: 'app-gamification-config',
  standalone: true,
  imports: [FormsModule, DecimalPipe, IconComponent],
  templateUrl: './gamification-config.html',
  styleUrl: './gamification-config.css',
})
export class GamificationConfigComponent implements OnInit {
  readonly supabase = inject(SupabaseService);

  readonly isLoading = signal(true);
  readonly levels    = signal<LevelRow[]>([]);
  readonly isSaving  = signal(false);
  readonly successMsg = signal<string | null>(null);
  readonly errorMsg   = signal<string | null>(null);

  /* Form */
  newLevelNum   = 1;
  newXPRequired = 100;
  newLevelTitle = '';

  async ngOnInit(): Promise<void> {
    await this.loadLevels();
  }

  async loadLevels(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('levels')
        .select('id, level_number, xp_required, title')
        .order('level_number', { ascending: true });

      if (error) throw error;
      this.levels.set((data ?? []) as LevelRow[]);
      this.newLevelNum = (data?.length ?? 0) + 1;
      this.newXPRequired = (data?.length ?? 0) * 500 + 500;
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addLevel(): Promise<void> {
    if (this.newLevelNum <= 0 || this.newXPRequired < 0) return;
    this.isSaving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    try {
      const { error } = await this.supabase.client.from('levels').insert({
        level_number: this.newLevelNum,
        xp_required:  this.newXPRequired,
        title:        this.newLevelTitle.trim() || `Level ${this.newLevelNum}`,
      });

      if (error) throw error;

      this.successMsg.set(`✅ Level ${this.newLevelNum} added successfully!`);
      this.newLevelTitle = '';
      await this.loadLevels();
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    } finally {
      this.isSaving.set(false);
    }
  }
}
