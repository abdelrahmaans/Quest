import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle';
import { LangToggleComponent } from '../../../shared/ui/lang-toggle';
import { I18nService } from '../../../core/services/i18n.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { IconName } from '../../../shared/ui/icon/icons.constants';

interface Stat   { value: string; label: string; }
interface Feature { icon: IconName; title: string; desc: string; color: string; }
interface Step   { num: string; title: string; desc: string; }
interface Testimonial { name: string; role: string; text: string; avatar: string; }

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, IconComponent, ThemeToggleComponent, LangToggleComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePageComponent {
  readonly i18n    = inject(I18nService);
  readonly auth    = inject(AuthService);
  readonly menuOpen = signal(false);

  readonly stats: Stat[] = [
    { value: '10K+', label: 'Active Students' },
    { value: '500+', label: 'Instructors' },
    { value: '2M+',  label: 'XP Earned' },
    { value: '98%',  label: 'Satisfaction' },
  ];

  readonly features: Feature[] = [
    {
      icon: 'zap',
      title: 'XP & Leveling',
      desc: 'Students earn experience points for every activity — attendance, assignments, challenges — and level up in real time.',
      color: '#F59E0B',
    },
    {
      icon: 'trophy',
      title: 'Badges & Achievements',
      desc: 'Unlock beautiful badges for milestones. Achievements persist across sessions and build a proud learning portfolio.',
      color: '#8B5CF6',
    },
    {
      icon: 'target',
      title: 'Live Challenges',
      desc: 'Instructors launch timed challenges in seconds. Students compete, collaborate, and sharpen skills under pressure.',
      color: '#EF4444',
    },
    {
      icon: 'bar-chart-2',
      title: 'Real-time Leaderboard',
      desc: 'See who\'s leading the class right now. Rankings update instantly, keeping every student motivated to climb higher.',
      color: '#0D9488',
    },
    {
      icon: 'flame',
      title: 'Streak Tracking',
      desc: 'Daily and weekly streaks reward consistency. Students who show up regularly build unstoppable momentum.',
      color: '#F97316',
    },
    {
      icon: 'shield-check',
      title: 'Secure & Role-Based',
      desc: 'Instructors, students, parents, and admins each see exactly what they need — nothing more, nothing less.',
      color: '#3B82F6',
    },
  ];

  readonly steps: Step[] = [
    { num: '01', title: 'Create your class',  desc: 'Set up in minutes. Invite students with a single link.' },
    { num: '02', title: 'Design the journey', desc: 'Customize XP rules, badges, and challenge types for your subject.' },
    { num: '03', title: 'Launch & engage',    desc: 'Run live sessions with real-time XP, challenges, and leaderboards.' },
    { num: '04', title: 'Track & improve',    desc: 'Deep analytics show what\'s working and where students need help.' },
  ];

  readonly testimonials: Testimonial[] = [
    {
      name: 'Sara Al-Rashidi',
      role: 'Mathematics Teacher — Riyadh',
      text: 'Mada Quest completely transformed my classroom. Students who never spoke up now race to answer questions for XP!',
      avatar: 'S',
    },
    {
      name: 'Ahmed Khaled',
      role: 'Physics Instructor — Cairo',
      text: 'The leaderboard creates healthy competition. My students\' test scores improved 22% in one semester.',
      avatar: 'A',
    },
    {
      name: 'Fatima Hassan',
      role: 'Parent — Dubai',
      text: 'I can finally see what my daughter is doing in class. She\'s excited about school in a way I\'ve never seen before.',
      avatar: 'F',
    },
  ];
}
