import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import type { IconName } from '../../../shared/ui/icon/icons.constants';

interface StatCard { icon: IconName; label: string; value: string | number; color: string; change?: string; }
interface RecentStudent { name: string; xp: number; level: number; badge?: string; }

@Component({
  selector: 'app-instructor-overview',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class InstructorOverviewComponent implements OnInit {
  readonly auth      = inject(AuthService);
  readonly supabase  = inject(SupabaseService);

  readonly isLoading     = signal(true);
  readonly totalStudents = signal(0);
  readonly totalClasses  = signal(0);
  readonly totalXP       = signal(0);
  readonly activeSessions = signal(0);

  readonly recentStudents = signal<RecentStudent[]>([]);

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  readonly stats = () => [
    { icon: 'user'         as IconName, label: 'Total Students',   value: this.totalStudents(),  color: '#0D9488', change: '+3 this week' },
    { icon: 'graduation-cap' as IconName, label: 'Active Classes',   value: this.totalClasses(),   color: '#8B5CF6', change: 'All running' },
    { icon: 'zap'          as IconName, label: 'XP Distributed',   value: this.totalXP().toLocaleString(), color: '#F59E0B', change: '+2,400 today' },
    { icon: 'target'       as IconName, label: 'Active Sessions',   value: this.activeSessions(), color: '#EF4444', change: 'Live now' },
  ];

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      // Load class count
      const { count: classCount } = await this.supabase.client
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', user.id);

      this.totalClasses.set(classCount ?? 0);

      // Load students in those classes
      const { count: studentCount } = await this.supabase.client
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', user.id);

      this.totalStudents.set(studentCount ?? 0);

      // Load total XP given across all students of this instructor
      const { data: xpStudentData } = await this.supabase.client
        .from('students')
        .select('xp_total')
        .eq('instructor_id', user.id);

      const total = (xpStudentData ?? []).reduce((sum, r) => sum + (r.xp_total ?? 0), 0);
      this.totalXP.set(total);

      // Recent students (top by XP) — join via classes
      const { data: topStudents } = await this.supabase.client
        .from('students')
        .select('id, full_name, xp_total, level')
        .eq('instructor_id', user.id)
        .order('xp_total', { ascending: false })
        .limit(5);

      this.recentStudents.set(
        (topStudents ?? []).map(s => ({
          name:  s.full_name ?? 'Student',
          xp:    s.xp_total  ?? 0,
          level: s.level      ?? 1,
        })),
      );
    } catch {
      // Non-critical — keep zeros
    } finally {
      this.isLoading.set(false);
    }
  }
}
