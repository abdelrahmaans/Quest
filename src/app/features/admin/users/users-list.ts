import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

interface AdminUserProfile {
  id: string;
  full_name: string;
  role: 'admin' | 'instructor';
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, DatePipe, IconComponent],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class AdminUsersComponent implements OnInit {
  readonly auth     = inject(AuthService);
  readonly supabase = inject(SupabaseService);

  readonly isLoading = signal(true);
  readonly users     = signal<AdminUserProfile[]>([]);
  readonly roleFilter = signal<'all' | 'instructor' | 'admin'>('all');
  readonly searchQuery = signal('');
  readonly errorMsg   = signal<string | null>(null);

  get filteredUsers(): AdminUserProfile[] {
    const role = this.roleFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return this.users().filter(u => {
      const matchRole = role === 'all' || u.role === role;
      const matchQuery = !query || u.full_name.toLowerCase().includes(query);
      return matchRole && matchQuery;
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('id, full_name, role, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.users.set((data ?? []) as AdminUserProfile[]);
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async toggleRole(user: AdminUserProfile): Promise<void> {
    const newRole = user.role === 'admin' ? 'instructor' : 'admin';
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;

      this.users.update(list =>
        list.map(u => u.id === user.id ? { ...u, role: newRole } : u),
      );
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    }
  }

  async toggleStatus(user: AdminUserProfile): Promise<void> {
    const newStatus = !user.is_active;
    try {
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      this.users.update(list =>
        list.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u),
      );
    } catch (e: unknown) {
      this.errorMsg.set((e as Error).message);
    }
  }
}
