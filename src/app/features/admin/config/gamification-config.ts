import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

interface ClassOption {
  id: string;
  name: string;
  public_code: string;
}

interface LevelRow {
  id: string;
  class_id: string;
  level_number: number;
  xp_required: number;
  name: string;
}

@Component({
  selector: 'app-gamification-config',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink, IconComponent],
  templateUrl: './gamification-config.html',
  styleUrl: './gamification-config.css',
})
export class GamificationConfigComponent implements OnInit {
  readonly supabase = inject(SupabaseService);

  readonly isLoadingClasses = signal(true);
  readonly isLoadingLevels  = signal(false);
  readonly classes          = signal<ClassOption[]>([]);
  readonly selectedClassId  = signal<string>('');
  readonly levels           = signal<LevelRow[]>([]);
  readonly isSaving         = signal(false);
  readonly successMsg       = signal<string | null>(null);
  readonly errorMsg         = signal<string | null>(null);

  /* Form inputs */
  newLevelNum   = 1;
  newXPRequired = 100;
  newLevelTitle = '';

  async ngOnInit(): Promise<void> {
    await this.loadClasses();
  }

  async loadClasses(): Promise<void> {
    this.isLoadingClasses.set(true);
    this.errorMsg.set(null);
    try {
      const { data, error } = await this.supabase.client
        .from('classes')
        .select('id, name, public_code')
        .order('name', { ascending: true });

      if (error) throw error;

      const list = (data ?? []) as ClassOption[];
      this.classes.set(list);

      if (list.length > 0) {
        const firstId = list[0].id;
        this.selectedClassId.set(firstId);
        await this.loadLevels(firstId);
      }
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    } finally {
      this.isLoadingClasses.set(false);
    }
  }

  async onClassChange(classId: string): Promise<void> {
    this.selectedClassId.set(classId);
    this.successMsg.set(null);
    this.errorMsg.set(null);
    await this.loadLevels(classId);
  }

  async loadLevels(classId: string): Promise<void> {
    if (!classId) {
      this.levels.set([]);
      return;
    }

    this.isLoadingLevels.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('levels')
        .select('id, class_id, level_number, xp_required, name')
        .eq('class_id', classId)
        .order('level_number', { ascending: true });

      if (error) throw error;

      const levelList = (data ?? []) as LevelRow[];
      this.levels.set(levelList);
      this.newLevelNum = (levelList.length ?? 0) + 1;
      this.newXPRequired = (levelList.length ?? 0) * 500 + 500;
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    } finally {
      this.isLoadingLevels.set(false);
    }
  }

  async addLevel(): Promise<void> {
    const classId = this.selectedClassId();
    if (!classId) {
      this.errorMsg.set('Please select a class first.');
      return;
    }

    if (this.newLevelNum <= 0 || this.newXPRequired < 0) return;

    this.isSaving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    try {
      const { error } = await this.supabase.client.from('levels').insert({
        class_id:     classId,
        level_number: this.newLevelNum,
        xp_required:  this.newXPRequired,
        name:         this.newLevelTitle.trim() || `Level ${this.newLevelNum}`,
      });

      if (error) throw error;

      this.successMsg.set(`✅ Level ${this.newLevelNum} added successfully!`);
      this.newLevelTitle = '';
      await this.loadLevels(classId);
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    } finally {
      this.isSaving.set(false);
    }
  }
}
