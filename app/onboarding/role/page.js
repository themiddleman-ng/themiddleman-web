'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RoleSelectionPage() {
  const router = useRouter();

  const [wantsToBuy, setWantsToBuy] = useState(true);
  const [wantsToSell, setWantsToSell] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    setLoading(true);
    setError('');

    // Get the currently logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }

    // Upsert their row in public.users with the roles they picked
    const { error: updateError } = await supabase
      .from('users')
      .upsert({ id: user.id, is_buyer: wantsToBuy, is_seller: wantsToSell });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // If they want to sell, send them to build a seller profile
    // (which starts in 'pending' verification status).
    // If not, send them straight to the marketplace.
    if (wantsToSell) {
      router.push('/onboarding/seller');
    } else {
      router.push('/marketplace');
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto' }}>
      <h1>What brings you here?</h1>
      <p>You can choose both — this isn&apos;t locked in forever.</p>

      <label>
        <input
          type="checkbox"
          checked={wantsToBuy}
          onChange={(e) => setWantsToBuy(e.target.checked)}
        />
        I want to hire people
      </label>

      <label>
        <input
          type="checkbox"
          checked={wantsToSell}
          onChange={(e) => setWantsToSell(e.target.checked)}
        />
        I want to offer my services
      </label>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button
        onClick={handleContinue}
        disabled={loading || (!wantsToBuy && !wantsToSell)}
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}