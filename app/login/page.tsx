'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
        router.refresh();
    }

    return (
        <div className="min-h-screen hero-bg flex items-center justify-center px-4">
            <div className="glass rounded-3xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="number-badge mx-auto mb-4 text-sm">DH</div>
                    <h1 className="text-2xl font-black text-white">Welcome back</h1>
                    <p className="text-green-200/60 mt-2 text-sm">Sign in to your Digital Heroes account</p>
                </div>

                {error && <div className="bg-red-900/40 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-green-200/70 mb-1">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            className="input-dark"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-green-200/70 mb-1">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            required
                            className="input-dark"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        className="btn-gold w-full mt-2"
                    >
                        {loading ? 'Signing in…' : 'Sign In →'}
                    </button>
                </form>

                <p className="text-center text-green-200/50 text-sm mt-6">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-gold-light hover:underline">Sign up free</Link>
                </p>
            </div>
        </div>
    );
}
