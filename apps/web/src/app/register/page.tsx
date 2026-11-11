import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Create account · Video meetings',
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Sign up with your email to start scheduling meetings."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
