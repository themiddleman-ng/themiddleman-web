'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const CATEGORIES = [
	{ value: 'development', label: 'Development' },
	{ value: 'design', label: 'Design' },
	{ value: 'marketing', label: 'Marketing' },
	{ value: 'writing', label: 'Writing' },
	{ value: 'ai_assisted', label: 'AI-assisted' },
];

const EXPERIENCE_TIERS = [
	{ value: 'beginner', label: 'Beginner' },
	{ value: 'intermediate', label: 'Intermediate' },
	{ value: 'expert', label: 'Expert' },
];

function EscrowIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
			<rect x="3" y="11" width="18" height="10" rx="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	);
}

export default function NewGigPage() {
	const router = useRouter();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState('');
	const [priceNgn, setPriceNgn] = useState('');
	const [deliveryDays, setDeliveryDays] = useState('7');
	const [experienceTier, setExperienceTier] = useState('beginner');
	const [isAiAssisted, setIsAiAssisted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const formReady =
		title.trim().length > 0 &&
		description.trim().length >= 30 &&
		category.length > 0 &&
		Number(priceNgn) > 0 &&
		Number(deliveryDays) > 0;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');
		if (!formReady) return;

		const price = parseInt(priceNgn, 10);
		const days = parseInt(deliveryDays, 10);

		if (isNaN(price) || price <= 0) { setError('Enter a valid price.'); return; }
		if (isNaN(days) || days <= 0) { setError('Enter a valid delivery time.'); return; }

		setLoading(true);

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) { setError('You must be logged in.'); setLoading(false); return; }

		const { data: profile, error: profileError } = await supabase
			.from('seller_profiles')
			.select('id, verification_status')
			.eq('user_id', user.id)
			.single();

		if (profileError || !profile) {
			setError('You need a seller profile before creating a gig.');
			setLoading(false); return;
		}
		if (profile.verification_status !== 'approved') {
			setError('Your seller account is still under review.');
			setLoading(false); return;
		}

		const { error: insertError } = await supabase.from('gigs').insert({
			seller_id: profile.id,
			title: title.trim(),
			description: description.trim(),
			category,
			price_ngn: price,
			delivery_days: days,
			experience_tier: experienceTier,
			is_ai_assisted: isAiAssisted,
		});

		if (insertError) { setError(insertError.message); setLoading(false); return; }
		router.push('/gigs/mine');
	}

	const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || 'Category';

	return (
		<main className="min-h-screen bg-ink text-bone">
			<header className="border-b border-line bg-paper/50 backdrop-blur sticky top-0 z-20">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
					<Link href="/" className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
						<span className="h-2.5 w-2.5 rounded-full bg-ember shadow-[0_0_0_4px_rgba(242,100,25,.15)]" />
						The Middleman
					</Link>
					<Link href="/gigs/mine" className="text-sm text-slate hover:text-bone transition-colors flex items-center gap-2">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
						My Gigs
					</Link>
				</div>
			</header>

			<div className="mx-auto max-w-7xl px-6 py-10">
				<div className="mb-10">
					<p className="text-xs font-bold tracking-[.2em] text-ember uppercase">New Manifest</p>
					<h1 className="mt-2 font-display text-4xl font-bold">What are you offering?</h1>
					<p className="mt-3 text-sm text-slate max-w-xl">Be specific — buyers search by skill, not category. Your gig goes live immediately after submission.</p>
				</div>

				<div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr]">
					<form onSubmit={handleSubmit} className="space-y-8">
						<div className="field-shell">
							<label className="field-label">Gig Title</label>
							<span className="field-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></span>
							<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. I will build a responsive Next.js landing page" className="field-input bg-ink/50 border-white/10 text-bone placeholder:text-slate/50" />
						</div>

						<div className="field-shell">
							<label className="field-label">Description <span className="text-slate font-normal normal-case tracking-normal ml-1">(Min 30 chars)</span></label>
							<span className="field-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
							<textarea required minLength={30} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe exactly what the buyer gets, what you need from them, and your process." className="field-input bg-ink/50 border-white/10 text-bone placeholder:text-slate/50 min-h-[120px]" />
							<p className="mt-1 text-xs text-slate text-right">{description.length} / 30 min</p>
						</div>

						<div className="grid gap-6 sm:grid-cols-2">
							<div className="field-shell">
								<label className="field-label">Category</label>
								<select required value={category} onChange={(e) => setCategory(e.target.value)} className="field-input bg-ink/50 border-white/10 text-bone">
									<option value="" disabled>Select category</option>
									{CATEGORIES.map((c) => <option key={c.value} value={c.value} className="bg-ink">{c.label}</option>)}
								</select>
							</div>
							<div className="field-shell">
								<label className="field-label">Experience Level</label>
								<select required value={experienceTier} onChange={(e) => setExperienceTier(e.target.value)} className="field-input bg-ink/50 border-white/10 text-bone">
									{EXPERIENCE_TIERS.map((t) => <option key={t.value} value={t.value} className="bg-ink">{t.label}</option>)}
								</select>
							</div>
						</div>

						<div className="grid gap-6 sm:grid-cols-2">
							<div className="field-shell">
								<label className="field-label">Price (₦)</label>
								<span className="field-icon font-mono text-sm">₦</span>
								<input required type="number" min="1" value={priceNgn} onChange={(e) => setPriceNgn(e.target.value)} placeholder="50000" className="field-input bg-ink/50 border-white/10 text-bone pl-8 font-mono" />
							</div>
							<div className="field-shell">
								<label className="field-label">Delivery Time</label>
								<span className="field-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
								<input required type="number" min="1" max="90" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} placeholder="7" className="field-input bg-ink/50 border-white/10 text-bone font-mono" />
								<span className="absolute right-4 top-[38px] text-xs text-slate pointer-events-none">Days</span>
							</div>
						</div>

						<div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
							<input id="ai-assisted" type="checkbox" checked={isAiAssisted} onChange={(e) => setIsAiAssisted(e.target.checked)} className="mt-1 accent-ember" />
							<label htmlFor="ai-assisted" className="text-sm cursor-pointer">
								<span className="font-semibold text-bone">AI-assisted gig</span>
								<span className="block text-xs text-slate mt-0.5">Check this if you use AI tools as part of your delivery. This will be clearly labeled for buyers.</span>
							</label>
						</div>

						{error && (
							<div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
								{error}
							</div>
						)}

						<div className="flex flex-col-reverse gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-xs text-slate">Your gig goes live immediately. You can pause it from My Gigs.</p>
							<button type="submit" disabled={loading || !formReady} className="btn-ripple auth-button w-full sm:w-auto sm:px-10 disabled:opacity-40 disabled:cursor-not-allowed">
								{loading ? 'Publishing...' : 'Publish Manifest'}
							</button>
						</div>
					</form>

					<div className="lg:sticky lg:top-24 h-fit">
						<div className="flex items-center justify-between mb-4">
							<p className="text-[10px] font-bold tracking-[.16em] text-ember uppercase">Live Preview</p>
							<span className="flex items-center gap-1.5 text-[10px] text-slate"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />Auto-updating</span>
						</div>

						<div className="live-ticket-preview relative rounded-xl px-6 pt-6 pb-5">
							<div className="ticket-notch-left" style={{background: '#0D0D0D'}} />
							<div className="ticket-notch-right" style={{background: '#0D0D0D'}} />

							<div className="flex items-center gap-2.5 mb-5">
								<div className="w-8 h-8 rounded-full bg-ember/20 border border-ember/30 flex items-center justify-center font-display font-bold text-xs text-ember">ME</div>
								<div>
									<p className="text-[12px] font-medium text-bone">Your Name</p>
									<div className="flex items-center gap-1 mt-0.5">
										{[1,2,3,4,5].map((i) => <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= 4 ? '#F26419' : 'none'} stroke="#F26419" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
										<span className="text-[10px] text-slate ml-1">(New)</span>
									</div>
								</div>
							</div>

							<div className="perforation-divider -mx-6 mb-5" style={{backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.1) 0 6px, transparent 6px 12px)'}} />

							<p className="text-[9px] uppercase tracking-wider text-slate mb-1.5">{categoryLabel}</p>
							<p className="font-display font-bold text-[16px] leading-snug mb-2 text-bone min-h-[40px]">{title || 'Your Gig Title Will Appear Here...'}</p>
							<p className="text-[12px] text-slate mb-6 leading-relaxed line-clamp-3 min-h-[54px]">{description || 'Your description will appear here. Make sure it is at least 30 characters long to pass validation.'}</p>

							<div className="flex items-center justify-between pt-4 border-t border-white/5">
								<span className="inline-flex items-center gap-1.5 text-[10px] text-slate"><EscrowIcon />Escrow protected</span>
								<span className="font-mono text-lg text-bone font-bold">₦{priceNgn ? Number(priceNgn).toLocaleString() : '0'}</span>
							</div>

							{isAiAssisted && (
								<div className="mt-4 pt-4 border-t border-white/5">
									<span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded">
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
										AI-ASSISTED DELIVERY
									</span>
								</div>
							)}
						</div>

						<p className="mt-4 text-[11px] text-slate text-center leading-relaxed px-4">This is exactly how buyers will see your product in the marketplace.</p>
					</div>
				</div>
			</div>
		</main>
	);
}
