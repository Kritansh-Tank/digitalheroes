'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({ full_name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        router.push('/dashboard?welcome=true');
        router.refresh();
    }

    return (
        <div className="min-h-screen hero-bg flex items-center justify-center px-4">
            <div className="glass rounded-3xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="number-badge mx-auto mb-4 text-sm">DH</div>
                    <h1 className="text-2xl font-black text-white">Become a Digital Hero</h1>
                    <p className="text-green-200/60 mt-2 text-sm">Create your free account to get started</p>
                </div>

                {error && <div className="bg-red-900/40 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-green-200/70 mb-1">Full Name</label>
                        <input
                            id="signup-name"
                            type="text"
                            required
                            className="input-dark"
                            placeholder="John Smith"
                            value={form.full_name}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-green-200/70 mb-1">Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            required
                            className="input-dark"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-green-200/70 mb-1">Password <span className="text-green-200/40">(min 8 characters)</span></label>
                        <input
                            id="signup-password"
                            type="password"
                            required
                            minLength={8}
                            className="input-dark"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button
                        id="signup-submit"
                        type="submit"
                        disabled={loading}
                        className="btn-gold w-full mt-2"
                    >
                        {loading ? 'Creating account…' : 'Create Account →'}
                    </button>
                </form>

                <p className="text-center text-green-200/40 text-xs mt-4">
                    By signing up, you agree to our Terms of Service. Charity contributions are a minimum of 10% of your subscription.
                </p>

                <p className="text-center text-green-200/50 text-sm mt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="text-gold-light hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
