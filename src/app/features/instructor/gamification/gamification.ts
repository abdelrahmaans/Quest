import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { XpService } from '../../../core/services/xp.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { AiAssistantDrawerComponent } from '../../../shared/ui/ai-assistant-drawer/ai-assistant-drawer';

interface Student { id: string; full_name: string; xp_total: number; level: number; class_id: string; }
interface ClassItem { id: string; name: string; }
interface XPEvent  { id: string; student_name: string; points: number; reason: string; created_at: string; }

const XP_PRESETS = [
  { label: '+5',   value: 5,   icon: '⭐' },
  { label: '+10',  value: 10,  icon: '⚡' },
  { label: '+25',  value: 25,  icon: '🔥' },
  { label: '+50',  value: 50,  icon: '💎' },
  { label: '+100', value: 100, icon: '🏆' },
];

const XP_REASONS = [
  'Correct Answer', 'Participation', 'Homework', 'Quiz', 'Challenge Win',
  'Helping Others', 'Attendance', 'Creative Work', 'Custom…',
];

@Component({
  selector: 'app-gamification',
  standalone: true,
  imports: [FormsModule, DecimalPipe, IconComponent, AiAssistantDrawerComponent],
  templateUrl: './gamification.html',
  styleUrl: './gamification.css',
})
export class GamificationComponent implements OnInit {
  readonly auth     = inject(AuthService);
  readonly supabase = inject(SupabaseService);
  readonly xpService = inject(XpService);
  readonly route    = inject(ActivatedRoute);

  /* AI Assistant State */
  readonly isAiDrawerOpen = signal<boolean>(false);

  /* State */
  readonly classes       = signal<ClassItem[]>([]);
  readonly students      = signal<Student[]>([]);
  readonly recentEvents  = signal<XPEvent[]>([]);
  readonly isLoading     = signal(true);
  readonly isAwarding    = signal(false);
  readonly successMsg    = signal<string | null>(null);
  readonly errorMsg      = signal<string | null>(null);

  /* Form */
  selectedClassId  = '';
  selectedStudentId = '';
  selectedXP       = 10;
  customXP         = '';
  selectedReason   = 'Participation';
  customReason     = '';
  useCustomXP      = false;

  readonly presets = XP_PRESETS;
  readonly reasons = XP_REASONS;

  get finalXP(): number {
    if (this.useCustomXP) return parseInt(this.customXP, 10) || 0;
    return this.selectedXP;
  }

  get finalReason(): string {
    return this.selectedReason === 'Custom…' ? this.customReason : this.selectedReason;
  }

  get filteredStudents(): Student[] {
    if (!this.selectedClassId) return this.students();
    return this.students().filter(s => s.class_id === this.selectedClassId);
  }

  async ngOnInit(): Promise<void> {
    const classFilter = this.route.snapshot.queryParamMap.get('class');
    await this.loadClasses();
    if (classFilter) {
      this.selectedClassId = classFilter;
      await this.loadStudents();
    }
    await this.loadRecentEvents();
    this.isLoading.set(false);
  }

  async loadClasses(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const { data } = await this.supabase.client
      .from('classes').select('id, name').eq('instructor_id', user.id).order('name');
    this.classes.set(data ?? []);
  }

  async loadStudents(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const query = this.supabase.client
      .from('students').select('id, full_name, xp_total, level, class_id')
      .eq('instructor_id', user.id).order('full_name');
    const { data } = await query;
    this.students.set(data ?? []);
  }

  async onClassChange(): Promise<void> {
    this.selectedStudentId = '';
    await this.loadStudents();
  }

  async loadRecentEvents(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    // Get student IDs belonging to this instructor
    const studentIds = this.students().map(s => s.id);
    if (studentIds.length === 0) {
      this.recentEvents.set([]);
      return;
    }

    const { data } = await this.supabase.client
      .from('xp_events')
      .select('id, points, reason, created_at, student_id')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })
      .limit(10);

    // Enrich with student names
    const events: XPEvent[] = await Promise.all(
      (data ?? []).map(async (ev: { id: string; points: number; reason: string; created_at: string; student_id: string }) => {
        const { data: s } = await this.supabase.client
          .from('students').select('full_name').eq('id', ev.student_id).single();
        return {
          id: ev.id, points: ev.points, reason: ev.reason, created_at: ev.created_at,
          student_name: (s as { full_name: string } | null)?.full_name ?? 'Unknown Student',
        };
      }),
    );
    this.recentEvents.set(events);
  }

  selectPreset(v: number): void {
    this.selectedXP = v;
    this.useCustomXP = false;
  }

  async awardXP(): Promise<void> {
    if (!this.selectedStudentId || this.finalXP <= 0 || !this.finalReason) return;
    this.isAwarding.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const { error } = await this.xpService.awardXp({
        studentId:  this.selectedStudentId,
        classId:    this.selectedClassId || null,
        points:      this.finalXP,
        reason:      this.finalReason,
        sourceType: 'manual',
      });

      if (error) throw error;

      const student = this.students().find(s => s.id === this.selectedStudentId);
      this.successMsg.set(`✅ Awarded ${this.finalXP} XP to ${student?.full_name ?? 'student'}!`);
      this.selectedStudentId = '';
      await this.loadRecentEvents();

      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    } finally {
      this.isAwarding.set(false);
    }
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  openAiDrawer(): void {
    this.isAiDrawerOpen.set(true);
  }

  closeAiDrawer(): void {
    this.isAiDrawerOpen.set(false);
  }
}

