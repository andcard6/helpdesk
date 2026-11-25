import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.maxLength(20)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, phone, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.auth
      .register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        password,
      })
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: (e) => {
          this.error.set(
            e.status === 409
              ? 'Ese email ya está registrado'
              : e.status === 0
                ? 'No se pudo conectar con el servidor'
                : 'Datos inválidos: revisa el email y usa una contraseña de 8 a 72 caracteres',
          );
          this.loading.set(false);
        },
      });
  }

  protected hasError(
    controlName: 'name' | 'email' | 'phone' | 'password' | 'confirmPassword',
    errorCode: string,
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty) && !!control.errors?.[errorCode];
  }

  protected hasPasswordMismatch(): boolean {
    const confirm = this.form.controls.confirmPassword;
    return (confirm.touched || confirm.dirty) && !!this.form.errors?.['passwordMismatch'];
  }
}
