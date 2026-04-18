'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthUser {
    userId: string;
    email: string;
    role: 'user' | 'admin';
    fullName: string;
}

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [checked, setChecked] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        fetch('/api/auth/me')
            .then((r) => r.json())
            .then((d) => { setUser(d.user ?? null); setChecked(true); })
            .catch(() => setChecked(true));
    }, [pathname]); // re-check on route change

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/');
        router.refresh();
    }

    const close = () => setMenuOpen(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gold/10">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2" onClick={close}>
                    <div className="number-badge text-sm">DH</div>
                    <span className="font-bold text-xl text-white">
                        Digital <span className="gradient-text">Heroes</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <div className="hidden md:flex items-center gap-6 text-sm text-green-200/80">
                    <Link href="/charities" className="hover:text-gold-light transition-colors">Charities</Link>
                    <Link href="/pricing" className="hover:text-gold-light transition-colors">Pricing</Link>

                    {checked && user ? (
                        <>
                            <Link
                                href={user.role === 'admin' ? '/admin' : '/dashboard'}
                                className="hover:text-gold-light transition-colors"
                            >
                                {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                            </Link>
                            <div className="flex items-center gap-3">
                                <span className="text-green-200/50 text-xs">{user.fullName}</span>
                                <button onClick={handleLogout} className="btn-forest text-sm px-4 py-2">
                                    Sign out
                                </button>
                            </div>
                        </>
                    ) : checked ? (
                        <>
                            <Link href="/login" className="btn-forest text-sm px-4 py-2">Sign in</Link>
                            <Link href="/signup" className="btn-gold text-sm px-4 py-2">Get Started</Link>
                        </>
                    ) : null}
                </div>

                {/* Mobile hamburger */}
                <button className="md:hidden text-green-200" onClick={() => setMenuOpen(!menuOpen)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden glass border-t border-gold/10 px-4 py-4 flex flex-col gap-3">
                    <Link href="/charities" className="text-green-200/80" onClick={close}>Charities</Link>
                    <Link href="/pricing" className="text-green-200/80" onClick={close}>Pricing</Link>

                    {checked && user ? (
                        <>
                            <Link
                                href={user.role === 'admin' ? '/admin' : '/dashboard'}
                                className="text-green-200/80"
                                onClick={close}
                            >
                                {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                            </Link>
                            <span className="text-green-200/40 text-xs">{user.email}</span>
                            <button onClick={() => { handleLogout(); close(); }} className="btn-forest text-center text-sm">
                                Sign out
                            </button>
                        </>
                    ) : checked ? (
                        <>
                            <Link href="/login" className="btn-forest text-center text-sm" onClick={close}>Sign in</Link>
                            <Link href="/signup" className="btn-gold text-center text-sm" onClick={close}>Get Started</Link>
                        </>
                    ) : null}
                </div>
            )}
        </nav>
    );
}
