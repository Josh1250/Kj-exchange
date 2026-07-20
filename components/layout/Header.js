import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../pages/_app';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-bg-secondary border-b border-border px-4 md:px-6 py-4 sticky top-0 z-50 backdrop-blur-lg bg-bg-secondary/80">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo with Image */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image 
            src="/logo.png" 
            alt="KJ Exchange" 
            width={40} 
            height={40} 
            className="h-10 w-auto transition-transform group-hover:scale-105"
            priority
          />
          <span className="text-xl font-bold hidden sm:block">
            <span className="text-purple">KJ</span>
            <span className="text-gray-400">Exchange</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="text-text-muted hover:text-text-primary transition text-sm md:text-base">
            Home
          </Link>

          {!loading && user ? (
            <>
              <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition text-sm md:text-base">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-orange hover:text-orange-light transition text-sm md:text-base"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-text-muted hover:text-text-primary transition text-sm md:text-base">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-light transition shadow-orange shadow-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
