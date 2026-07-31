import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, Input } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { register as registerUser } from '@/firebase/auth.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

interface FormValues { name: string; username: string; password: string; }

export function RegisterPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      const { user } = await registerUser(values.name, values.username, values.password);
      setSession(user);
      toast(`Welcome to Ledger, ${user.name}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking expenses in style">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Name">
          <Input placeholder="Jane Doe" {...register('name', { required: true })} />
        </Field>
        <Field label="Username">
          <Input placeholder="yourname" {...register('username', { required: true, minLength: 3 })} />
        </Field>
        <Field label="Password">
          <Input type="password" placeholder="At least 6 characters" {...register('password', { required: true, minLength: 6 })} />
        </Field>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <GlassButton type="submit" variant="primary" full disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </GlassButton>
      </form>
      <p className="text-sm text-cream-50/55 text-center mt-6">
        Already have an account? <Link to="/login" className="text-gold-300 hover:text-gold-200 font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
