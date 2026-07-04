'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SellerOnboardingPage() {
  const router = useRouter();

  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');       // comma-separated input
  const [portfolio, setPortfolio] = useState('');  // comma-separated input
  const [idFile, setIdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }

    let idDocumentUrl = null;

    // Upload the ID document to Storage, if provided
    if (idFile) {
      const filePath = `${user.id}/${Date.now()}-${idFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('verification-docs')
        .upload(filePath, idFile);

      if (uploadError) {
        setError('ID upload failed: ' + uploadError.message);
        setLoading(false);
        return;
      }
      idDocumentUrl = filePath; // store the path, not a public URL, since bucket is private
    }

    // Turn "React, Next.js, Figma" into ["React", "Next.js", "Figma"]
    const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
    const portfolioArray = portfolio.split(',').map((p) => p.trim()).filter(Boolean);

    const { error: insertError } = await supabase.from('seller_profiles').insert({
      user_id: user.id,
      bio,
      skills: skillsArray,
      portfolio_links: portfolioArray,
      id_document_url: idDocumentUrl,
      // verification_status defaults to 'pending' — set by the schema itself
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/onboarding/pending');
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto' }}>
      <h1>Tell us about your work</h1>
      <p>This gets reviewed before you can list gigs — usually within 48 hours.</p>

      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Short bio — what do you do?"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Skills (comma-separated, e.g. React, Figma, Copywriting)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <input
          type="text"
          placeholder="Portfolio links (comma-separated URLs)"
          value={portfolio}
          onChange={(e) => setPortfolio(e.target.value)}
        />
        <label>
          ID or business document
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setIdFile(e.target.files[0])}
            required
          />
        </label>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}
