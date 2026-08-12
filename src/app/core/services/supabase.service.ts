import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    if (environment.supabaseUrl && environment.supabaseKey) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    } else {
      console.warn(
        '[MadaQuest] Supabase URL or Key is missing in environment. Please update environment.ts with SUPABASE_URL and SUPABASE_ANON_KEY.'
      );
    }
  }

  get client(): SupabaseClient {
    if (!this.supabase) {
      if (environment.supabaseUrl && environment.supabaseKey) {
        this.initClient();
      } else {
        throw new Error(
          '[MadaQuest] Supabase client is not initialized. Provide SUPABASE_URL and SUPABASE_ANON_KEY in environment.ts.'
        );
      }
    }
    return this.supabase!;
  }

  public isConfigured(): boolean {
    return !!(environment.supabaseUrl && environment.supabaseKey);
  }
}
