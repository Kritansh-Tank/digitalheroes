import Navbar from '@/components/Navbar';
import Link from 'next/link';

const steps = [
  { num: '01', title: 'Subscribe', desc: 'Join with a monthly or yearly plan. Every subscription contributes to the prize pool and a charity you choose.' },
  { num: '02', title: 'Enter Scores', desc: 'Log your last 5 Stableford scores. Your numbers are automatically generated from your performance.' },
  { num: '03', title: 'Monthly Draw', desc: 'Every month, a draw runs against your numbers. Match 3, 4, or all 5 to win your share of the prize pool.' },
  { num: '04', title: 'Give & Win', desc: '10% of every subscription goes to your chosen charity. Win prizes and make an impact every single month.' },
];

const prizes = [
  { match: '5 Numbers', pct: '40%', label: 'Jackpot', tier: 'tier-5' },
  { match: '4 Numbers', pct: '35%', label: 'Silver', tier: 'tier-4' },
  { match: '3 Numbers', pct: '25%', label: 'Bronze', tier: 'tier-3' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen hero-bg">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-green-200/80 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Monthly draw now open — Join before the 30th
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Golf that <span className="gradient-text">gives back.</span>
          </h1>

          <p className="text-xl text-green-200/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track your Stableford scores, enter the monthly prize draw automatically, and support a charity you believe in — all from one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-gold text-lg px-8 py-4 text-center">
              Start Playing &amp; Giving →
            </Link>
            <Link href="/charities" className="btn-forest text-lg px-8 py-4 text-center">
              Explore Charities
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[['£12,400', 'Prize Pool'], ['47', 'Charities'], ['3', 'Prize Tiers']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-black gradient-text">{val}</div>
                <div className="text-xs text-green-200/50 mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center text-white mb-4">
            How it <span className="gradient-text">Works</span>
          </h2>
          <p className="text-center text-green-200/60 mb-16 max-w-xl mx-auto">
            Four simple steps to track your game, win prizes, and change lives.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="glass rounded-2xl p-6 card-hover">
                <div className="number-badge mb-4">{s.num}</div>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-green-200/60 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prize Draw ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Monthly <span className="gradient-text">Prize Draw</span>
          </h2>
          <p className="text-green-200/60 mb-12 max-w-xl mx-auto">
            A fixed portion of every subscription goes into the prize pool. Match numbers to win your tier.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {prizes.map((p) => (
              <div key={p.match} className={`rounded-2xl p-6 card-hover glass ${p.tier === 'tier-5' ? 'glow-gold' : ''}`}>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${p.tier}`}>{p.label}</div>
                <div className="text-4xl font-black text-white mb-2">{p.pct}</div>
                <div className="text-green-200/60 text-sm">of prize pool</div>
                <div className="mt-3 font-semibold text-green-200">{p.match}</div>
                {p.tier === 'tier-5' && (
                  <div className="mt-2 text-xs text-gold-light/80">Jackpot rolls over if unclaimed!</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Charity Spotlight ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-forest/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Every Game <span className="gradient-text">Changes Lives</span>
          </h2>
          <p className="text-green-200/60 mb-8 max-w-xl mx-auto">
            A minimum of 10% of every subscription goes to the charity you choose. You can increase your contribution at any time.
          </p>
          <Link href="/charities" className="btn-gold inline-block px-8 py-4">
            Browse Charities
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center glass rounded-3xl p-12 glow-gold">
          <h2 className="text-3xl font-black text-white mb-4">Ready to be a Digital Hero?</h2>
          <p className="text-green-200/60 mb-8">Join hundreds of golfers making every round count.</p>
          <Link href="/signup" className="btn-gold text-lg px-10 py-4 inline-block">
            Subscribe Now →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gold/10 py-8 px-4 text-center text-green-200/40 text-sm">
        <p>© {new Date().getFullYear()} Digital Heroes · digitalheroes.co.in</p>
      </footer>
    </div>
  );
}
