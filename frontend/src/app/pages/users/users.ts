import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth.service';

@Component({
  imports: [],
  selector: 'app-users',
  styleUrl: './users.css',
  templateUrl: './users.html',
})
export class Users {
  protected auth = inject(AuthService);
}
