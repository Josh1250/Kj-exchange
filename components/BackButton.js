import Link from 'next/link';

export default function BackButton({ href, label }) {
  return (
    <Link
      href={href || '/dashboard'}
      className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
    >
      <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
      <span className="text-sm font-medium">{label || 'Back'}</span>
    </Link>
  );
}
