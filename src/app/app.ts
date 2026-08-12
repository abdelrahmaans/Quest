import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TempDevBadgeComponent } from './shared/ui/temp-dev-badge'; // TEMP-TESTING: import dev badge

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TempDevBadgeComponent], // TEMP-TESTING: import badge
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
