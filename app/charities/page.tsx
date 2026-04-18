import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import AuthCTA from '@/components/AuthCTA';

async function getCharities() {
    const { data, error } = await supabaseAdmin
        .from('charities')
        .select('*')
        .eq('active', true)
        .order('featured', { ascending: false })
        .order('name');

    if (error) {
        console.error('[charities] fetch error:', error);
        return [];
    }
    return data ?? [];
}

interface Charity {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website?: string;
    featured: boolean;
}

export default async function CharitiesPage() {
    const charities: Charity[] = await getCharities();
    const featured = charities.filter((c: Charity) => c.featured);
    const rest = charities.filter((c: Charity) => !c.featured);

    return (
        <div className="min-h-screen hero-bg">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
                <h1 className="text-4xl font-black text-white mb-2">Our <span className="gradient-text">Charities</span></h1>
                <p className="text-green-200/60 mb-12">Every subscription contributes at least 10% to a charity you choose.</p>

                {featured.length > 0 && (
                    <>
                        <h2 className="text-xs uppercase tracking-widest text-gold mb-4">Featured</h2>
                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                            {featured.map((c: Charity) => (
                                <div key={c.id} className="glass rounded-2xl p-6 card-hover glow-gold">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-forest-light flex items-center justify-center text-gold font-bold text-lg">
                                            {c.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{c.name}</div>
                                            <div className="text-xs text-gold">⭐ Featured</div>
                                        </div>
                                    </div>
                                    <p className="text-green-200/70 text-sm leading-relaxed mb-4">{c.description}</p>
                                    {c.website && (
                                        <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-gold-light hover:underline">Visit website →</a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <h2 className="text-xs uppercase tracking-widest text-gold mb-4">All Charities</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {rest.map((c: Charity) => (
                        <div key={c.id} className="glass rounded-xl p-5 card-hover">
                            <div className="w-10 h-10 rounded-lg bg-forest-light flex items-center justify-center text-gold font-bold mb-3">
                                {c.name[0]}
                            </div>
                            <div className="font-semibold text-white text-sm mb-1">{c.name}</div>
                            <p className="text-green-200/60 text-xs leading-relaxed">{c.description}</p>
                        </div>
                    ))}
                    {charities.length === 0 && (
                        <div className="col-span-3 text-center text-green-200/40 py-16">Charities loading…</div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <AuthCTA className="btn-gold inline-block px-8 py-4">Choose Your Charity →</AuthCTA>
                </div>
            </div>
        </div>
    );
}
