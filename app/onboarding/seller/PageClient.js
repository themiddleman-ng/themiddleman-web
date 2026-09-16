'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const SERVICE_CATEGORIES = ['Development', 'Design', 'Marketing', 'Writing', 'AI-assisted services'];
const ID_DOCUMENT_TYPES = ['National ID (NIN)', 'International passport', "Driver's licence", "Voter's card", 'CAC business certificate'];
const EXPERIENCE_RANGES = ['Less than 1 year', '1–2 years', '3–5 years', '6+ years'];

function getUploadErrorMessage(uploadError) {
  const message = uploadError?.message || 'Unknown upload error.';
  if (message.toLowerCase().includes('bucket')) {
    return 'Upload failed: the verification-docs storage bucket is missing or not available yet.';
  }
  if (message.includes('new row violates row-level security policy') || message.toLowerCase().includes('permission')) {
    return 'Upload failed: your storage policy is blocking this file. Check the verification-docs bucket policies.';
  }
  if (message.toLowerCase().includes('mime') || message.toLowerCase().includes('type')) {
    return 'Upload failed: use a JPG, PNG, or PDF file.';
  }
  return `Upload failed: ${message}`;
}

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [idDocumentType, setIdDocumentType] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageReady, setPageReady] = useState(false);
  const [agreementHighlighted, setAgreementHighlighted] = useState(false);
  const agreementRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function guardSellerAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/signup');
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('is_buyer, is_seller')
        .eq('id', user.id)
        .single();

      if (userError || !userRow) {
        router.replace('/onboarding/role');
        return;
      }

      if (!userRow.is_seller) {
        router.replace(userRow.is_buyer ? '/marketplace' : '/onboarding/role');
        return;
      }

      setPageReady(true);
    }

    guardSellerAccess();
  }, [router]);

  const toggleType = (type) =>
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );

  function flashAgreement() {
    agreementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setAgreementHighlighted(true);
    setTimeout(() => setAgreementHighlighted(false), 1600);
  }

  function clearSelectedDocument() {
    setIdFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!selectedTypes.length) { setError('Choose at least one service category.'); return; }
    if (!experience) { setError('Let us know your experience level.'); return; }
    if (!idDocumentType) { setError('Select which document you are uploading.'); return; }
    if (!idFile) { setError('Upload an ID or business document to continue.'); return; }
    if (idFile.size > 10 * 1024 * 1024) { setError('Your document must be 10 MB or smaller.'); return; }
    if (!accepted) {
      setError('Confirm the checkbox to continue.');
      flashAgreement();
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You must be logged in to continue.'); setLoading(false); return; }

    const filePath = `${user.id}/${Date.now()}-${idFile.name}`;
    const { error: uploadError } = await supabase.storage.from('verification-docs').upload(filePath, idFile, {
      contentType: idFile.type || undefined,
      upsert: false,
    });
    if (uploadError) { setError(getUploadErrorMessage(uploadError)); setLoading(false); return; }

    const { error: insertError } = await supabase.from('seller_profiles').upsert({
      user_id: user.id,
      display_name: displayName,
      bio,
      skills: skills.split(',').map((item) => item.trim()).filter(Boolean),
      portfolio_links: portfolio.split(',').map((item) => item.trim()).filter(Boolean),
      linkedin_url: linkedin.trim() || null,
      years_experience: experience,
      gig_categories: selectedTypes,
      id_document_type: idDocumentType,
      id_document_url: filePath,
      verification_status: 'pending',
    });
    if (insertError) { setError(insertError.message); setLoading(false); return; }

    router.push('/onboarding/pending');
  }

  if (!pageReady) {
    return (
      <main className="auth-shell text-bone">
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate">Checking your access…</div>
      </main>
    );
  }

  return (
    <main className="auth-shell text-bone">
      <section className="w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold tracking-tight text-bone">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-ember shadow-[0_0_0_6px_rgba(242,100,25,.14)]" />
            The Middleman
          </Link>
          <span className="rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-xs font-medium text-ember shadow-[0_0_0_1px_rgba(242,100,25,.08)]">Step 2 of 2</span>
        </div>

        <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-line bg-paper text-bone shadow-2xl shadow-black/25">
          <header className="border-b border-line bg-[radial-gradient(circle_at_top_right,_rgba(242,100,25,.2),_transparent_42%),linear-gradient(180deg,rgba(23,23,23,.92),rgba(17,17,17,1))] px-6 py-10 sm:px-10">
            <p className="text-xs font-semibold tracking-[.2em] text-ember">SELLER VERIFICATION</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-bone sm:text-5xl">Show buyers what you deliver.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate sm:text-base">
              Complete your creator profile and securely submit one verification document. A member of our team
              reviews every application by hand before you can publish products.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/10 px-4 py-2 text-xs font-medium text-ember">
              <span className="h-2 w-2 rounded-full bg-ember" />
              Required step before publishing products
            </div>
          </header>

          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.3fr_.7fr]">
            <div className="space-y-6">
              <section>
                <p className="text-xs font-bold tracking-[.16em] text-ember">01 · CREATOR PROFILE</p>
                <div className="mt-4 grid gap-4">
                  <label className="text-sm font-medium text-bone">
                    Creator or business name
                    <input
                      required
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className="auth-input mt-2 text-bone"
                      placeholder="e.g. PixelForge Studio"
                    />
                  </label>
                  <label className="text-sm font-medium text-bone">
                    What do you offer?
                    <textarea
                      required
                      minLength={30}
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      className="auth-input mt-2 min-h-28 text-bone"
                      placeholder="Describe the work you deliver and who it helps."
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-bone">
                      Years of experience
                      <select
                        required
                        value={experience}
                        onChange={(event) => setExperience(event.target.value)}
                        className="auth-input mt-2 text-bone"
                      >
                        <option value="" disabled>Select a range</option>
                        {EXPERIENCE_RANGES.map((range) => (
                          <option key={range} value={range}>{range}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-bone">
                      LinkedIn or professional profile
                      <input
                        value={linkedin}
                        onChange={(event) => setLinkedin(event.target.value)}
                        className="auth-input mt-2 text-bone"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </label>
                  </div>
                  <label className="text-sm font-medium text-bone">
                    Tools or technologies
                    <input
                      value={skills}
                      onChange={(event) => setSkills(event.target.value)}
                      className="auth-input mt-2 text-bone"
                      placeholder="Next.js, Figma, n8n, OpenAI"
                    />
                  </label>
                  <label className="text-sm font-medium text-bone">
                    Portfolio links
                    <input
                      value={portfolio}
                      onChange={(event) => setPortfolio(event.target.value)}
                      className="auth-input mt-2 text-bone"
                      placeholder="https://yourportfolio.com, https://github.com/..."
                    />
                  </label>
                </div>
              </section>

              <section className="border-t border-line pt-6">
                <p className="text-xs font-bold tracking-[.16em] text-ember">02 · WHAT SERVICES DO YOU OFFER?</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {SERVICE_CATEGORIES.map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selectedTypes.includes(type)
                          ? 'border-ember bg-ember/15 text-bone'
                          : 'border-line text-slate hover:border-slate'
                      }`}
                    >
                      {selectedTypes.includes(type) ? 'Selected · ' : ''}{type}
                    </button>
                  ))}
                </div>
              </section>

              <section className="border-t border-line pt-6">
                <div className="rounded-2xl border border-ember/20 bg-[linear-gradient(180deg,rgba(242,100,25,.12),rgba(242,100,25,.04))] p-5 shadow-[0_12px_30px_rgba(0,0,0,.14)]">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-ember px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.2em] text-ink">Required</span>
                    <p className="text-xs font-bold tracking-[.16em] text-ember">03 · IDENTITY CHECK</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate">
                    Review this section carefully. Your submission cannot continue until you confirm the box below and upload a valid document.
                  </p>
                </div>
                <label className="text-sm font-medium text-bone mt-4 block">
                  Document type
                  <select
                    required
                    value={idDocumentType}
                    onChange={(event) => setIdDocumentType(event.target.value)}
                    className="auth-input mt-2 text-bone"
                  >
                    <option value="" disabled>Select a document type</option>
                    {ID_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block rounded-2xl border border-dashed border-line bg-ink/30 p-5 text-sm text-slate hover:border-ember">
                  <span className="font-medium text-bone">Upload the selected document</span>
                  <span className="mt-1 block text-xs">JPG, PNG, or PDF · maximum 10 MB · stored privately</span>
                  <input
                    required
                    type="file"
                    accept="image/*,application/pdf"
                    ref={fileInputRef}
                    onChange={(event) => setIdFile(event.target.files?.[0] || null)}
                    className="mt-4 block w-full text-xs file:mr-4 file:rounded-full file:border-0 file:bg-ember file:px-4 file:py-2 file:font-semibold file:text-ink"
                  />
                  {idFile && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-ember">
                        Document ready: {idFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={clearSelectedDocument}
                        className="rounded-full border border-line px-3 py-1 font-medium text-slate transition-colors hover:border-ember hover:text-ember"
                      >
                        Cancel upload
                      </button>
                    </div>
                  )}
                </label>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-ember/15 bg-[radial-gradient(circle_at_top,_rgba(242,100,25,.12),_transparent_50%),linear-gradient(180deg,rgba(23,23,23,.82),rgba(13,13,13,.96))] p-6 shadow-[0_18px_50px_rgba(0,0,0,.22)]">
              <p className="text-xs font-bold tracking-[.16em] text-ember">WHAT HAPPENS NEXT</p>
              <ol className="mt-5 space-y-5 text-sm text-slate">
                <li><span className="mr-3 font-mono text-ember">01</span>A person on our team reviews your profile and document by hand.</li>
                <li><span className="mr-3 font-mono text-ember">02</span>Approved sellers can create product listings.</li>
                <li><span className="mr-3 font-mono text-ember">03</span>Products are clearly tagged when AI-assisted.</li>
              </ol>
              <div
                ref={agreementRef}
                className={`mt-7 rounded-2xl border border-line bg-ink/30 p-5 transition-all duration-300 ${
                  agreementHighlighted ? 'border-ember bg-ember/10 shadow-[0_0_0_4px_rgba(242,100,25,.15)]' : ''
                }`}
              >
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[.22em] text-ember">Confirmation required</p>
                <label className="flex cursor-pointer gap-3 text-xs leading-relaxed text-slate">
                  <input
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-line text-ember focus:ring-ember"
                  />
                  <span className={agreementHighlighted ? 'text-bone font-medium' : ''}>
                    I confirm that my details are accurate and that I have the right to offer the services I publish.
                  </span>
                </label>
              </div>
            </aside>
          </div>

          {error && (
            <div className="mx-6 mt-2 rounded-2xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300 sm:mx-10">
              {error}
            </div>
          )}

          <footer className="mt-8 flex flex-col-reverse gap-4 border-t border-line px-6 py-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p className="text-xs text-slate">Your document is only used for verification and reviewed by a person, not an algorithm.</p>
            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-semibold text-ink shadow-lg shadow-ember/25 transition-transform hover:-translate-y-0.5 hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
            >
              <span className="h-2 w-2 rounded-full bg-ink/60" />
              {loading ? 'Submitting application...' : 'Submit for review'}
            </button>
          </footer>
        </form>
      </section>
    </main>
  );
}
