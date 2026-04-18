'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    charityId: string;
    isLoggedIn: boolean;
    isSelected?: boolean;
}

export default function CharityAction({ charityId, isLoggedIn, isSelected = false }: Props) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!isLoggedIn) return null;

    async function handleSelect() {
        setLoading(true);
        try {
            const res = await fetch('/api/charities/selection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ charityId }),
            });
            if (res.ok) {
                router.push('/dashboard?tab=charity');
                router.refresh();
            }
        } catch (err) {
            console.error('Failed to select charity', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleSelect}
            disabled={loading || isSelected}
            className={`mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-all ${isSelected
                    ? 'bg-gold/20 text-gold cursor-default'
                    : 'bg-gold text-forest-dark hover:scale-[1.02] active:scale-[0.98]'
                }`}
        >
            {loading ? 'Processing...' : isSelected ? 'Selected ✓' : 'Support this Charity →'}
        </button>
    );
}
