'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Props {
    plan?: 'monthly' | 'yearly';
    className?: string;
    children: React.ReactNode;
}

/**
 * Auth-aware CTA button.
 * - Logged out: links to /signup (optionally with ?plan=)
 * - Logged in as user: links to /dashboard
 * - Logged in as admin: links to /admin
 */
export default function AuthCTA({ plan, className = '', children }: Props) {
    const [href, setHref] = useState<string>(plan ? `/signup?plan=${plan}` : '/signup');

    useEffect(() => {
        fetch('/api/auth/me')
            .then((r) => r.json())
            .then((d) => {
                if (!d.user) return;
                if (d.user.role === 'admin') {
                    setHref('/admin');
                } else if (plan) {
                    // Logged-in user clicking a plan → go to checkout
                    setHref(`/api/stripe/checkout?plan=${plan}`);
                } else {
                    setHref('/dashboard');
                }
            })
            .catch(() => { });
    }, [plan]);

    // For checkout links, use a button that POSTs
    if (href.startsWith('/api/stripe/checkout')) {
        return (
            <button
                className={className}
                onClick={async () => {
                    const res = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                }}
            >
                {children}
            </button>
        );
    }

    return <Link href={href} className={className}>{children}</Link>;
}
