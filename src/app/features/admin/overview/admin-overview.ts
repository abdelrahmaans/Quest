import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import type { IconName } from '../../../shared/ui/icon/icons.constants';

interface AdminStatCard {
  icon: IconName;
  label: string;
  value: number;
  color: string;
  sub: string;
}

interface RecentUser {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [RouterLink, DecimalPipe, IconComponent],
  templateUrl: './admin-overview.html',
  styleUrl: './admin-overview.css',
})
export class AdminOverviewComponent implements OnInit {
  readonly auth     = inject(AuthService);
  readonly supabase = inject(SupabaseService);

  readonly isLoading        = signal(true);
  readonly totalUsers       = signal(0);
  readonly totalInstructors = signal(0);
  readonly totalAdmins      = signal(0);
  readonly totalClasses     = signal(0);
  readonly totalStudents    = signal(0);
  readonly totalXP          = signal(0);
  readonly recentUsers      = signal<RecentUser[]>([]);

  readonly stats = () => [
    { icon: 'users'          as IconName, label: 'Total Accounts',    value: this.totalUsers(),       color: '#3B82F6', sub: `${this.totalInstructors()} Instructors · ${this.totalAdmins()} Admins` },
    { icon: 'graduation-cap' as IconName, label: 'Classes Created',   value: this.totalClasses(),     color: '#8B5CF6', sub: 'System-wide' },
    { icon: 'user'           as IconName, label: 'Total Students',    value: this.totalStudents(),    color: '#0D9488', sub: 'Enrolled across classes' },
    { icon: 'zap'            as IconName, label: 'Platform XP Total', value: this.totalXP(),          color: '#F59E0B', sub: 'Distributed by instructors' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      // 1. Load profiles count
      const { data: profiles } = await this.supabase.client
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false });

      const allProfiles = profiles ?? [];
      this.totalUsers.set(allProfiles.length);
      this.totalInstructors.set(allProfiles.filter((p: { role: string }) => p.role === 'instructor').length);
      this.totalAdmins.set(allProfiles.filter((p: { role: string }) => p.role === 'admin').length);

      this.recentUsers.set(
        allProfiles.slice(0, 5).map((p: { id: string; full_name: string; role: string; created_at: string }) => ({
          id:         p.id,
          full_name:  p.full_name,
          role:       p.role,
          created_at: p.created_at,
        })),
      );

      // 2. Load classes count
      const { count: classCount } = await this.supabase.client
        .from('classes')
        .select('id', { count: 'exact', head: true });
      this.totalClasses.set(classCount ?? 0);

      // 3. Load students count
      const { count: studentCount } = await this.supabase.client
        .from('students')
        .select('id', { count: 'exact', head: true });
      this.totalStudents.set(studentCount ?? 0);

      // 4. Load system total XP
      const { data: xpData } = await this.supabase.client
        .from('xp_events')
        .select('points');
      const sumXP = (xpData ?? []).reduce((acc: number, r: { points: number }) => acc + (r.points ?? 0), 0);
      this.totalXP.set(sumXP);
    } catch {
      // Fallback
    } finally {
      this.isLoading.set(false);
    }
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d}d ago`;
  }
}
