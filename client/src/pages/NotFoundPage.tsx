import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-4xl font-semibold text-slate-900">404</p>
      <p className="text-slate-500">This page doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to dashboard</Link>
    </div>
  );
}
