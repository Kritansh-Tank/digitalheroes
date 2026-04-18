'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AdminTab = 'users' | 'draws' | 'charities' | 'winners' | 'reports';

interface User { id: string; email: string; full_name: string; role: string; created_at: string; subscriptions?: { plan: string; status: string }[]; }
interface Draw { id: string; month: number; year: number; logic_type: string; status: string; jackpot_rollover_amount: number; }
interface Charity { id: string; name: string; description: string; active: boolean; featured: boolean; }
interface Winner { id: string; match_type: string; prize_amount: number; verified: boolean; paid_out: boolean; proof_url?: string; users?: { full_name: string; email: string }; draws?: { month: number; year: number }; }

export default function AdminDashboard() {
    const router = useRouter();
    const [tab, setTab] = useState<AdminTab>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [draws, setDraws] = useState<Draw[]>([]);
    const [charities, setCharities] = useState<Charity[]>([]);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [msg, setMsg] = useState('');

    // Draw form
    const [drawForm, setDrawForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), logic_type: 'random' });
    // Charity form
    const [charityForm, setCharityForm] = useState({ name: '', description: '', featured: false });

    useEffect(() => { fetchData(); }, [tab]);

    async function fetchData() {
        if (tab === 'users') {
            const res = await fetch('/api/admin/users');
            if (res.status === 403) { router.push('/dashboard'); return; }
            const d = await res.json();
            setUsers(d.users || []);
        } else if (tab === 'draws') {
            const res = await fetch('/api/admin/draws');
            const d = await res.json();
            setDraws(d.draws || []);
        } else if (tab === 'charities') {
            const res = await fetch('/api/charities');
            const d = await res.json();
            setCharities(d.charities || []);
        } else if (tab === 'winners') {
            const res = await fetch('/api/winners');
            const d = await res.json();
            setWinners(d.winners || []);
        }
    }

    async function createDraw() {
        const res = await fetch('/api/admin/draws', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(drawForm),
        });
        const d = await res.json();
        if (!res.ok) { setMsg('❌ ' + d.error); return; }
        setMsg('✅ Draw created!');
        fetchData();
    }

    async function runDraw(drawId: string, action: 'simulate' | 'publish') {
        const res = await fetch('/api/admin/draws', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drawId, action }),
        });
        const d = await res.json();
        if (!res.ok) { setMsg('❌ ' + d.error); return; }
        setMsg(`✅ Draw ${action}d! ${d.winningNumbers ? 'Numbers: ' + d.winningNumbers.join(', ') : ''}`);
        fetchData();
    }

    async function createCharity() {
        const res = await fetch('/api/admin/charities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(charityForm),
        });
        const d = await res.json();
        if (!res.ok) { setMsg('❌ ' + d.error); return; }
        setMsg('✅ Charity added!');
        setCharityForm({ name: '', description: '', featured: false });
        fetchData();
    }

    async function toggleCharity(id: string, featured: boolean) {
        await fetch('/api/admin/charities', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, featured: !featured }) });
        fetchData();
    }

    async function deleteCharity(id: string) {
        await fetch(`/api/admin/charities?id=${id}`, { method: 'DELETE' });
        fetchData();
    }

    async function verifyWinner(id: string, verified: boolean) {
        await fetch('/api/winners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winnerId: id, verified }) });
        fetchData();
    }

    async function markPaid(id: string) {
        await fetch('/api/winners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ winnerId: id, paid_out: true }) });
        fetchData();
    }

    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }

    const TABS: { key: AdminTab; label: string }[] = [
        { key: 'users', label: '👥 Users' },
        { key: 'draws', label: '🎲 Draws' },
        { key: 'charities', label: '🤝 Charities' },
        { key: 'winners', label: '🏆 Winners' },
        { key: 'reports', label: '📊 Reports' },
    ];

    return (
        <div className="min-h-screen" style={{ background: '#0f2118' }}>
            <header className="glass border-b border-gold/10 px-4 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="number-badge text-sm">DH</div>
                        <div>
                            <span className="font-bold text-white">Digital Heroes</span>
                            <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Admin</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-green-200/50 hover:text-green-200 text-sm">User View</Link>
                        <button onClick={logout} className="text-green-200/50 hover:text-green-200 text-sm">Sign out</button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {msg && (
                    <div className="glass border border-gold/30 rounded-xl px-6 py-3 mb-6 text-green-200 text-sm">{msg}
                        <button onClick={() => setMsg('')} className="ml-4 text-green-200/40 hover:text-green-200">✕</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 glass rounded-xl p-1 mb-8 w-fit overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-gold text-forest-dark' : 'text-green-200/60 hover:text-green-200'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── USERS ── */}
                {tab === 'users' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6">User Management <span className="text-green-200/40 text-sm font-normal">({users.length} total)</span></h2>
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Plan</th><th>Sub Status</th><th>Joined</th></tr></thead>
                                <tbody>
                                    {users.map((u) => {
                                        const sub = u.subscriptions?.[0];
                                        return (
                                            <tr key={u.id}>
                                                <td className="font-semibold text-white">{u.full_name}</td>
                                                <td>{u.email}</td>
                                                <td><span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-gold/20 text-gold' : 'bg-forest-light/50 text-green-200'}`}>{u.role}</span></td>
                                                <td>{sub?.plan || '—'}</td>
                                                <td><span className={`text-xs ${sub?.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{sub?.status || 'none'}</span></td>
                                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        );
                                    })}
                                    {users.length === 0 && <tr><td colSpan={6} className="text-center text-green-200/40 py-8">No users found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── DRAWS ── */}
                {tab === 'draws' && (
                    <div className="space-y-6">
                        {/* Create draw form */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Create New Draw</h2>
                            <div className="flex flex-wrap gap-3">
                                <select className="input-dark w-36" value={drawForm.month} onChange={(e) => setDrawForm({ ...drawForm, month: Number(e.target.value) })}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}</option>)}
                                </select>
                                <input type="number" className="input-dark w-28" value={drawForm.year} onChange={(e) => setDrawForm({ ...drawForm, year: Number(e.target.value) })} />
                                <select className="input-dark w-40" value={drawForm.logic_type} onChange={(e) => setDrawForm({ ...drawForm, logic_type: e.target.value })}>
                                    <option value="random">Random</option>
                                    <option value="algorithmic">Algorithmic</option>
                                </select>
                                <button onClick={createDraw} className="btn-gold px-4 py-2 text-sm">Create Draw</button>
                            </div>
                        </div>

                        {/* Draws list */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">All Draws</h2>
                            <table className="admin-table">
                                <thead><tr><th>Draw</th><th>Logic</th><th>Status</th><th>Rollover</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {draws.map((d) => (
                                        <tr key={d.id}>
                                            <td className="font-semibold text-white">{new Date(d.year, d.month - 1).toLocaleString('default', { month: 'long' })} {d.year}</td>
                                            <td><span className="text-xs px-2 py-0.5 bg-forest-light/50 rounded">{d.logic_type}</span></td>
                                            <td>
                                                <span className={`text-xs font-semibold ${d.status === 'published' ? 'text-green-400' : d.status === 'simulated' ? 'text-amber-400' : 'text-green-200/50'}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td>{d.jackpot_rollover_amount > 0 ? `£${(d.jackpot_rollover_amount / 100).toFixed(2)}` : '—'}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {d.status === 'draft' && <button onClick={() => runDraw(d.id, 'simulate')} className="text-xs btn-forest px-3 py-1">Simulate</button>}
                                                    {(d.status === 'draft' || d.status === 'simulated') && (
                                                        <button onClick={() => { if (confirm('Publish this draw? This cannot be undone.')) runDraw(d.id, 'publish'); }} className="text-xs btn-gold px-3 py-1">Publish</button>
                                                    )}
                                                    {d.status === 'published' && <span className="text-xs text-green-400">✓ Published</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {draws.length === 0 && <tr><td colSpan={5} className="text-center text-green-200/40 py-8">No draws yet</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── CHARITIES ── */}
                {tab === 'charities' && (
                    <div className="space-y-6">
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Add Charity</h2>
                            <div className="flex flex-wrap gap-3">
                                <input className="input-dark flex-1 min-w-[200px]" placeholder="Charity name" value={charityForm.name} onChange={(e) => setCharityForm({ ...charityForm, name: e.target.value })} />
                                <input className="input-dark flex-1 min-w-[200px]" placeholder="Description" value={charityForm.description} onChange={(e) => setCharityForm({ ...charityForm, description: e.target.value })} />
                                <label className="flex items-center gap-2 text-green-200/70 text-sm">
                                    <input type="checkbox" checked={charityForm.featured} onChange={(e) => setCharityForm({ ...charityForm, featured: e.target.checked })} /> Featured
                                </label>
                                <button onClick={createCharity} className="btn-gold px-4 py-2 text-sm">Add</button>
                            </div>
                        </div>
                        <div className="glass rounded-2xl p-6">
                            <table className="admin-table">
                                <thead><tr><th>Name</th><th>Featured</th><th>Active</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {charities.map((c) => (
                                        <tr key={c.id}>
                                            <td className="font-semibold text-white">{c.name}</td>
                                            <td><span className={`text-xs ${c.featured ? 'text-gold' : 'text-green-200/40'}`}>{c.featured ? '⭐ Yes' : 'No'}</span></td>
                                            <td><span className={`text-xs ${c.active ? 'text-green-400' : 'text-red-400'}`}>{c.active ? 'Active' : 'Hidden'}</span></td>
                                            <td>
                                                <div className="flex gap-3">
                                                    <button onClick={() => toggleCharity(c.id, c.featured)} className="text-xs text-gold-light hover:underline">{c.featured ? 'Unfeature' : 'Feature'}</button>
                                                    <button onClick={() => deleteCharity(c.id)} className="text-xs text-red-400 hover:underline">Remove</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── WINNERS ── */}
                {tab === 'winners' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6">Winners Management</h2>
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead><tr><th>Winner</th><th>Draw</th><th>Tier</th><th>Prize</th><th>Proof</th><th>Verified</th><th>Paid</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {winners.map((w) => (
                                        <tr key={w.id}>
                                            <td>
                                                <div className="font-semibold text-white text-xs">{w.users?.full_name}</div>
                                                <div className="text-green-200/40 text-xs">{w.users?.email}</div>
                                            </td>
                                            <td className="text-xs">{w.draws?.month}/{w.draws?.year}</td>
                                            <td><span className={`px-2 py-0.5 rounded text-xs font-bold tier-${w.match_type}`}>{w.match_type}-Match</span></td>
                                            <td className="font-bold text-white">£{(w.prize_amount / 100).toFixed(2)}</td>
                                            <td>{w.proof_url ? <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-xs text-gold-light hover:underline">View</a> : <span className="text-xs text-green-200/30">None</span>}</td>
                                            <td><span className={`text-xs ${w.verified ? 'text-green-400' : 'text-amber-400'}`}>{w.verified ? '✓' : '⏳'}</span></td>
                                            <td><span className={`text-xs ${w.paid_out ? 'text-green-400' : 'text-red-400'}`}>{w.paid_out ? '✓ Paid' : 'Pending'}</span></td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {!w.verified && <button onClick={() => verifyWinner(w.id, true)} className="text-xs btn-gold px-2 py-1">Verify</button>}
                                                    {w.verified && !w.paid_out && <button onClick={() => markPaid(w.id)} className="text-xs btn-forest px-2 py-1">Mark Paid</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {winners.length === 0 && <tr><td colSpan={8} className="text-center text-green-200/40 py-8">No winners yet</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── REPORTS ── */}
                {tab === 'reports' && (
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6">Reports & Analytics</h2>
                        <div className="grid md:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Users', value: users.length },
                                { label: 'Active Draws', value: draws.filter((d) => d.status !== 'published').length },
                                { label: 'Total Winners', value: winners.length },
                                { label: 'Unpaid Prizes', value: winners.filter((w) => !w.paid_out).length },
                            ].map((s) => (
                                <div key={s.label} className="glass-light rounded-xl p-4 text-center">
                                    <div className="text-3xl font-black gradient-text">{s.value}</div>
                                    <div className="text-xs text-green-200/50 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <p className="text-green-200/40 text-xs mt-8 text-center">Switch to other tabs to load fresh data for reports.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
