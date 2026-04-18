'use client';
import Navbar from '@/components/Navbar';
import AuthCTA from '@/components/AuthCTA';

const plans = [
    {
        id: 'monthly' as const,
        name: 'Monthly',
        price: '£9.99',
        period: '/month',
        desc: 'Flexible month-to-month access',
        features: ['Monthly prize draw entry', '10% to your charity', 'Score tracking (rolling 5)', 'Full platform access', 'Cancel anytime'],
        cta: 'Start Monthly',
        highlight: false,
    },
    {
        id: 'yearly' as const,
        name: 'Yearly',
        price: '£89.99',
        period: '/year',
        desc: 'Save 25% with annual commitment',
        badge: 'Best Value',
        features: ['Everything in Monthly', '2 months free (25% saving)', 'Priority draw notification', 'Yearly impact report', 'Lock in price for 12 months'],
        cta: 'Start Yearly',
        highlight: true,
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen hero-bg">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 pt-28 pb-16 text-center">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Simple <span className="gradient-text">Pricing</span>
                </h1>
                <p className="text-green-200/60 mb-16 max-w-xl mx-auto">
                    One subscription. Monthly draws. Charity impact. No hidden fees.
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {plans.map((p) => (
                        <div
                            key={p.id}
                            className={`rounded-2xl p-8 text-left relative ${p.highlight ? 'glow-gold border border-gold/40 bg-forest/60' : 'glass'}`}
                        >
                            {p.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-forest-dark text-xs font-bold px-4 py-1 rounded-full">
                                    {p.badge}
                                </div>
                            )}
                            <div className="text-gold text-sm font-semibold uppercase tracking-wider mb-2">{p.name}</div>
                            <div className="text-4xl font-black text-white mb-1">
                                {p.price}<span className="text-lg text-green-200/50">{p.period}</span>
                            </div>
                            <div className="text-green-200/60 text-sm mb-6">{p.desc}</div>
                            <ul className="space-y-3 mb-8">
                                {p.features.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-green-200/80 text-sm">
                                        <svg className="w-4 h-4 text-gold shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            {/* AuthCTA: logged-out → /signup?plan=X, logged-in → triggers Stripe checkout */}
                            <AuthCTA
                                plan={p.id}
                                className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${p.highlight ? 'btn-gold' : 'btn-forest'}`}
                            >
                                {p.cta} →
                            </AuthCTA>
                        </div>
                    ))}
                </div>

                <div className="glass rounded-2xl p-6 max-w-lg mx-auto text-sm text-green-200/60">
                    <strong className="text-green-200">Charity note:</strong> A minimum of 10% of every subscription goes to your chosen charity. You can increase this percentage at any time from your dashboard.
                </div>
            </div>
        </div>
    );
}
