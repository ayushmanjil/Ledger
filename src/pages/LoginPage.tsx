import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Field, Input } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { login, loginAsDemo } from '@/firebase/auth.service';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

interface FormValues { username: string; password: string; }

export function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isDemoLoading, setIsDemoLoading] = useState(false);

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

  const handleDemoLogin = async () => {
    setError('');
    setIsDemoLoading(true);
    try {
      const { user } = await loginAsDemo();
      setSession(user);
      toast(`Signed in as ${user.name}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in as demo user.');
    } finally {
      setIsDemoLoading(false);
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
        <GlassButton type="submit" variant="primary" full disabled={isSubmitting || isDemoLoading}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </GlassButton>
      </form>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <span className="relative bg-brown-950/80 backdrop-blur px-3 text-xs uppercase tracking-wider text-cream-50/40">
          or
        </span>
      </div>

      <GlassButton
        type="button"
        variant="ghost"
        full
        onClick={handleDemoLogin}
        disabled={isSubmitting || isDemoLoading}
        className="border border-gold-300/30 text-gold-200 hover:bg-gold-300/10"
      >
        <Sparkles size={16} />
        {isDemoLoading ? 'Setting up demo account…' : 'Try Demo Account'}
      </GlassButton>

      <p className="text-sm text-cream-50/55 text-center mt-6">
        New here? <Link to="/register" className="text-gold-300 hover:text-gold-200 font-medium">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

