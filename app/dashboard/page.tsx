'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Score { id: string; score: number; date: string; }
interface Winner { id: string; match_type: string; prize_amount: number; verified: boolean; paid_out: boolean; proof_url?: string; draws: { month: number; year: number }; }
interface Subscription { plan: string; status: string; current_period_end: string; }
interface CharitySelection { charity_id: string; contribution_pct: number; charities: { name: string }; }

function DashboardInner() {
    const router = useRouter();
    const params = useSearchParams();
    const [scores, setScores] = useState<Score[]>([]);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [sub, setSub] = useState<Subscription | null>(null);
    const [charity, setCharity] = useState<CharitySelection | null>(null);
    const [newScore, setNewScore] = useState({ score: '', date: '' });
    const [editId, setEditId] = useState<string | null>(null);
    const [editScore, setEditScore] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'scores' | 'charity' | 'wins'>('overview');

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchAll() {
        setLoading(true);
        const [scoresRes, winnersRes] = await Promise.all([
            fetch('/api/scores'),
            fetch('/api/winners'),
        ]);
        if (scoresRes.status === 401) { router.push('/login'); return; }
        const s = await scoresRes.json();
        const w = await winnersRes.json();
        setScores(s.scores || []);
        setWinners(w.winners || []);
        setLoading(false);
    }

    async function addScore() {
        if (!newScore.score || !newScore.date) return;
        const res = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: Number(newScore.score), date: newScore.date }),
        });
        const data = await res.json();
        if (!res.ok) { setMsg('❌ ' + data.error); return; }
        setMsg('✅ Score added!');
        setNewScore({ score: '', date: '' });
        fetchAll();
    }

    async function updateScore(id: string) {
        const res = await fetch(`/api/scores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: Number(editScore) }),
        });
        if (!res.ok) { setMsg('❌ Failed to update'); return; }
        setMsg('✅ Score updated!');
        setEditId(null);
        fetchAll();
    }

    async function deleteScore(id: string) {
        await fetch(`/api/scores/${id}`, { method: 'DELETE' });
        fetchAll();
    }

    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    const TABS = [
        { key: 'overview', label: 'Overview' },
        { key: 'scores', label: 'My Scores' },
        { key: 'charity', label: 'Charity' },
        { key: 'wins', label: 'Winnings' },
    ] as const;

    return (
        <div className="min-h-screen hero-bg">
            {/* Header */}
            <header className="glass border-b border-gold/10 px-4 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="number-badge text-sm">DH</div>
                        <span className="font-bold text-white text-lg">Digital <span className="gradient-text">Heroes</span></span>
                    </Link>
                    <button onClick={logout} className="text-green-200/50 hover:text-green-200 text-sm transition-colors">Sign out</button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {params.get('welcome') && (
                    <div className="glass border border-gold/30 rounded-xl px-6 py-4 mb-6 text-green-200">
                        🎉 Welcome to Digital Heroes! Start by subscribing to enter monthly draws.
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 glass rounded-xl p-1 mb-8 w-fit">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-gold text-forest-dark' : 'text-green-200/60 hover:text-green-200'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading && <div className="text-green-200/50 text-center py-16">Loading…</div>}

                {!loading && tab === 'overview' && (
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Subscription */}
                        <div className="glass rounded-2xl p-6">
                            <div className="text-xs text-gold uppercase tracking-wider mb-2">Subscription</div>
                            {sub ? (
                                <>
                                    <div className="text-2xl font-bold text-white capitalize">{sub.plan}</div>
                                    <div className={`text-sm mt-1 ${sub.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                        {sub.status === 'active' ? '✓ Active' : '⚠ ' + sub.status}
                                    </div>
                                    {sub.current_period_end && (
                                        <div className="text-xs text-green-200/40 mt-2">
                                            Renews {new Date(sub.current_period_end).toLocaleDateString()}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-green-200/60 text-sm mt-1">No active subscription</div>
                                    <Link href="/pricing" className="btn-gold inline-block mt-4 text-sm px-4 py-2">Subscribe Now</Link>
                                </>
                            )}
                        </div>

                        {/* Score summary */}
                        <div className="glass rounded-2xl p-6">
                            <div className="text-xs text-gold uppercase tracking-wider mb-2">Recent Scores</div>
                            <div className="text-2xl font-bold text-white">{scores.length} / 5</div>
                            <div className="text-green-200/60 text-sm mt-1">Stableford scores logged</div>
                            {scores.length > 0 && (
                                <div className="mt-3 flex gap-1 flex-wrap">
                                    {scores.slice(0, 5).map((s) => (
                                        <span key={s.id} className="px-2 py-0.5 bg-forest-light rounded text-xs text-green-200">{s.score}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Winnings */}
                        <div className="glass rounded-2xl p-6">
                            <div className="text-xs text-gold uppercase tracking-wider mb-2">Total Winnings</div>
                            <div className="text-2xl font-bold text-white">
                                £{(winners.reduce((acc, w) => acc + w.prize_amount, 0) / 100).toFixed(2)}
                            </div>
                            <div className="text-green-200/60 text-sm mt-1">{winners.length} prize(s) won</div>
                            {winners.some((w) => !w.paid_out) && (
                                <div className="text-amber-400 text-xs mt-2">⏳ Payment pending</div>
                            )}
                        </div>
                    </div>
                )}

                {!loading && tab === 'scores' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6">My Golf Scores</h2>
                        <p className="text-green-200/50 text-xs mb-4">
                            Your last 5 Stableford scores (1–45). Adding a new score when you have 5 will auto-remove the oldest.
                        </p>

                        {/* Add score form */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            <input
                                type="number" min={1} max={45}
                                placeholder="Score (1–45)"
                                className="input-dark w-36"
                                value={newScore.score}
                                onChange={(e) => setNewScore({ ...newScore, score: e.target.value })}
                            />
                            <input
                                type="date"
                                className="input-dark w-44"
                                value={newScore.date}
                                onChange={(e) => setNewScore({ ...newScore, date: e.target.value })}
                            />
                            <button onClick={addScore} className="btn-gold px-4 py-2 text-sm">Add Score</button>
                        </div>
                        {msg && <div className="mb-4 text-sm text-green-200/80">{msg}</div>}

                        {scores.length === 0 ? (
                            <div className="text-green-200/40 text-center py-8">No scores yet. Add your first round above.</div>
                        ) : (
                            <table className="admin-table">
                                <thead><tr><th>Date</th><th>Score</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {scores.map((s) => (
                                        <tr key={s.id}>
                                            <td>{new Date(s.date).toLocaleDateString()}</td>
                                            <td>
                                                {editId === s.id ? (
                                                    <input
                                                        type="number" min={1} max={45}
                                                        className="input-dark w-24 text-sm py-1"
                                                        value={editScore}
                                                        onChange={(e) => setEditScore(e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="font-bold text-white">{s.score}</span>
                                                )}
                                            </td>
                                            <td>
                                                {editId === s.id ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => updateScore(s.id)} className="text-xs btn-gold px-3 py-1">Save</button>
                                                        <button onClick={() => setEditId(null)} className="text-xs text-green-200/50">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setEditId(s.id); setEditScore(String(s.score)); }} className="text-xs text-gold-light hover:underline">Edit</button>
                                                        <button onClick={() => deleteScore(s.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {!loading && tab === 'charity' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Selected Charity</h2>
                        {charity ? (
                            <div>
                                <div className="text-xl text-white mb-1">{charity.charities?.name}</div>
                                <div className="text-green-200/60 text-sm">Contribution: {charity.contribution_pct}% of your subscription</div>
                            </div>
                        ) : (
                            <div className="text-green-200/60 mb-4">You haven&apos;t selected a charity yet.</div>
                        )}
                        <Link href="/charities" className="btn-gold inline-block mt-4 text-sm px-4 py-2">
                            {charity ? 'Change Charity' : 'Choose a Charity'}
                        </Link>
                    </div>
                )}

                {!loading && tab === 'wins' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6">My Winnings</h2>
                        {winners.length === 0 ? (
                            <div className="text-green-200/40 text-center py-8">No winnings yet. Keep playing!</div>
                        ) : (
                            <table className="admin-table">
                                <thead><tr><th>Draw</th><th>Match</th><th>Prize</th><th>Status</th><th>Proof</th></tr></thead>
                                <tbody>
                                    {winners.map((w) => (
                                        <tr key={w.id}>
                                            <td>{w.draws?.month}/{w.draws?.year}</td>
                                            <td><span className={`px-2 py-0.5 rounded text-xs font-bold tier-${w.match_type}`}>{w.match_type}-Match</span></td>
                                            <td className="font-bold text-white">£{(w.prize_amount / 100).toFixed(2)}</td>
                                            <td>
                                                {w.paid_out ? <span className="text-green-400 text-xs">✓ Paid</span> :
                                                    w.verified ? <span className="text-amber-400 text-xs">⏳ Processing</span> :
                                                        <span className="text-red-400 text-xs">Pending verification</span>}
                                            </td>
                                            <td>
                                                {w.proof_url ? (
                                                    <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-xs text-gold-light hover:underline">View</a>
                                                ) : (
                                                    <span className="text-green-200/40 text-xs">No proof yet</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen hero-bg flex items-center justify-center"><div className="text-green-200/50">Loading…</div></div>}>
            <DashboardInner />
        </Suspense>
    );
}
