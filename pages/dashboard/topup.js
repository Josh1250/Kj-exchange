import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';

export default function TopUp() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard/wallet');
    } else if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  return <div className="flex items-center justify-center min-h-screen text-text-primary">Redirecting...</div>;
}
