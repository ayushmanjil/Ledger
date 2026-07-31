import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, Input } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { login } from '@/firebase/auth.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

interface FormValues { username: string; password: string; }

export function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      const { user } = await login(values.username, values.password);
      setSession(user);
      toast(`Welcome back, ${user.name}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid username or password.');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your leather-bound ledger">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Username">
          <Input placeholder="yourname" {...register('username', { required: true })} />
        </Field>
        <Field label="Password">
          <Input type="password" placeholder="••••••••" {...register('password', { required: true })} />
        </Field>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <GlassButton type="submit" variant="primary" full disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </GlassButton>
      </form>
      <p className="text-sm text-cream-50/55 text-center mt-6">
        New here? <Link to="/register" className="text-gold-300 hover:text-gold-200 font-medium">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
