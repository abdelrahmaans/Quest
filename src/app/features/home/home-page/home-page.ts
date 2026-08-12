import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle';
import { LangToggleComponent } from '../../../shared/ui/lang-toggle';
import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { IconName } from '../../../shared/ui/icon/icons.constants';

interface Stat   { value: string; label: string; }
interface Feature { icon: IconName; title: string; desc: string; color: string; }
interface Step   { num: string; title: string; desc: string; }
interface Testimonial { name: string; role: string; text: string; avatar: string; rating: number; }
interface LeaderboardUser { rank: number; name: string; classOrTrack: string; xp: number; badgesCount: number; streak: number; avatar: string; }
interface AchieverItem { id: string; user: string; type: string; title: string; xpBonus: number; timeAgo: string; icon: IconName; }
interface BadgeItem { id: string; name: string; desc: string; rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary'; xp: number; icon: IconName; }
interface ChallengeItem { id: string; title: string; track: string; timeLeft: string; xpReward: number; badgeName: string; }

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent, ThemeToggleComponent, LangToggleComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePageComponent {
  readonly i18n     = inject(I18nService);
  readonly auth     = inject(AuthService);
  readonly menuOpen = signal(false);

  /* Public Search State */
  readonly searchTab   = signal<'student' | 'group'>('student');
  readonly searchQuery = signal<string>('');
  readonly searchFeedback = signal<{ found: boolean; title?: string; details?: string } | null>(null);

  /* Leaderboard Tabs State */
  readonly leaderboardTab = signal<'all' | 'week' | 'month' | 'track'>('all');

  readonly stats: Stat[] = [
    { value: '10K+', label: 'Active Students' },
    { value: '500+', label: 'Instructors' },
    { value: '2M+',  label: 'XP Earned' },
    { value: '98%',  label: 'Satisfaction' },
  ];

  readonly features: Feature[] = [
    {
      icon: 'zap',
      title: 'XP & Level Progression',
      desc: 'Students earn experience points for attendance, code exercises, and teamwork, advancing through visual levels.',
      color: '#0D9488',
    },
    {
      icon: 'trophy',
      title: 'Collectible Badges',
      desc: 'Unlock achievements for milestones. Badges build a proud, lifelong portfolio of learning accomplishments.',
      color: '#F59E0B',
    },
    {
      icon: 'target',
      title: 'Live Timed Quests',
      desc: 'Instructors launch instant challenges in seconds. Students collaborate and solve challenges under pressure.',
      color: '#EF4444',
    },
    {
      icon: 'bar-chart-2',
      title: 'Interactive Leaderboard',
      desc: 'See who leads the class right now. Rankings update dynamically, fostering healthy, positive motivation.',
      color: '#0D9488',
    },
    {
      icon: 'flame',
      title: 'Streak Momentum',
      desc: 'Daily and weekly streaks reward consistency. Students who show up regularly build unstoppable momentum.',
      color: '#F59E0B',
    },
    {
      icon: 'shield-check',
      title: 'Role-Based Ecosystem',
      desc: 'Instructors, students, parents, and admins each access a tailored, intuitive interface designed for their role.',
      color: '#3B82F6',
    },
  ];

  readonly leaderboardUsers: LeaderboardUser[] = [
    { rank: 1, name: 'Farida Amer', classOrTrack: 'Advanced Python', xp: 2100, badgesCount: 6, streak: 15, avatar: 'FA' },
    { rank: 2, name: 'Hamza Ibrahim', classOrTrack: 'Robotics & AI Junior', xp: 1800, badgesCount: 5, streak: 12, avatar: 'HI' },
    { rank: 3, name: 'Karim Nabil', classOrTrack: 'Advanced Python', xp: 1650, badgesCount: 4, streak: 9, avatar: 'KN' },
    { rank: 4, name: 'Omar Khaled', classOrTrack: 'Web Development', xp: 1450, badgesCount: 4, streak: 7, avatar: 'OK' },
    { rank: 5, name: 'Malak Hany', classOrTrack: 'Advanced Python', xp: 1300, badgesCount: 3, streak: 7, avatar: 'MH' },
    { rank: 6, name: 'Laila Mahmoud', classOrTrack: 'Web Development', xp: 1200, badgesCount: 3, streak: 5, avatar: 'LM' },
  ];

  readonly achieversFeed: AchieverItem[] = [
    { id: '1', user: 'Farida Amer', type: 'Badge', title: 'Unlocked Code Ninja', xpBonus: 100, timeAgo: '10m ago', icon: 'trophy' },
    { id: '2', user: 'Omar Khaled', type: 'Streak', title: 'Reached 7-Day Streak', xpBonus: 50, timeAgo: '25m ago', icon: 'flame' },
    { id: '3', user: 'Hamza Ibrahim', type: 'Challenge', title: 'Won Robotics Duel', xpBonus: 150, timeAgo: '1h ago', icon: 'zap' },
    { id: '4', user: 'Laila Mahmoud', type: 'Level Up', title: 'Reached Level 4', xpBonus: 200, timeAgo: '2h ago', icon: 'sparkles' },
  ];

  readonly badgesList: BadgeItem[] = [
    { id: 'b1', name: 'Code Ninja', desc: 'Mastered programming core fundamentals.', rarity: 'Epic', xp: 100, icon: 'zap' },
    { id: 'b2', name: 'Early Bird', desc: 'Punctual attendance for 10 consecutive sessions.', rarity: 'Common', xp: 50, icon: 'clock' },
    { id: 'b3', name: 'Team Catalyst', desc: 'Helped peers solve complex coding bugs.', rarity: 'Rare', xp: 75, icon: 'users' },
    { id: 'b4', name: 'Streak Master', desc: 'Maintained a 14-day daily learning streak.', rarity: 'Legendary', xp: 200, icon: 'flame' },
  ];

  readonly steps: Step[] = [
    { num: '01', title: 'Create your class',  desc: 'Set up in minutes. Invite students with a single link or code.' },
    { num: '02', title: 'Design the journey', desc: 'Customize XP rules, badges, and challenge types for your subject.' },
    { num: '03', title: 'Launch & engage',    desc: 'Run live sessions with real-time XP, challenges, and leaderboards.' },
    { num: '04', title: 'Track & improve',    desc: 'Deep analytics show what\'s working and where students need help.' },
  ];

  readonly testimonials: Testimonial[] = [
    {
      name: 'Sara Al-Rashidi',
      role: 'Mathematics Teacher — Riyadh',
      text: 'Quest Engine completely transformed my classroom. Students who never spoke up now race to answer questions for XP!',
      avatar: 'S',
      rating: 5,
    },
    {
      name: 'Ahmed Khaled',
      role: 'Physics Instructor — Cairo',
      text: 'The leaderboard creates healthy competition. My students\' test scores improved 22% in one semester.',
      avatar: 'A',
      rating: 5,
    },
    {
      name: 'Fatima Hassan',
      role: 'Parent — Dubai',
      text: 'I can finally see what my daughter is doing in class. She\'s excited about school in a way I\'ve never seen before.',
      avatar: 'F',
      rating: 5,
    },
  ];

  readonly activeChallenges: ChallengeItem[] = [
    { id: 'c1', title: 'Loop Sprint: 10-Min Fast Code', track: 'Web Development', timeLeft: '1h 45m', xpReward: 150, badgeName: 'Code Ninja' },
    { id: 'c2', title: 'Algorithmic Duel: Sorting Algorithms', track: 'Data Science', timeLeft: '3h 12m', xpReward: 250, badgeName: 'Streak Master' },
  ];

  performSearch(): void {
    const q = this.searchQuery().trim().toUpperCase();
    if (!q) {
      this.searchFeedback.set(null);
      return;
    }

    if (this.searchTab() === 'student') {
      this.searchFeedback.set({
        found: true,
        title: `Student Profile Verified: ${q}`,
        details: `Level 4 · 1,450 XP · 7-Day Streak · Enrolled in Web Development & UI Quest`,
      });
    } else {
      this.searchFeedback.set({
        found: true,
        title: `Group verified: ${q}`,
        details: `Web Development & UI Quest · 15 Active Students · Avg XP: 950`,
      });
    }
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
