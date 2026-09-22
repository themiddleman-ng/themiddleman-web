'use client';

import { useState } from 'react';

const TABS = ['General', 'For Buyers', 'For Sellers'] as const;
type Tab = (typeof TABS)[number];

const QUESTIONS: Record<Tab, { q: string; a: string }[]> = {
  General: [
    {
      q: 'What is The Middleman?',
      a: 'A Nigeria-wide marketplace for verified digital products, software, templates, creative assets, and legitimate digital services. Every order is protected by escrow — payment is held until the buyer approves delivery.',
    },
    {
      q: 'Which currencies can I pay in?',
      a: 'All prices are shown in Naira (₦) by default. Multi-currency payment support is on our roadmap for sellers and buyers working across borders.',
    },
    {
      q: 'How is this different from buying a product through WhatsApp or Twitter?',
      a: "Informal buying offers little protection. Here, your payment stays in escrow until you confirm delivery, and every seller is identity-verified before publishing a product listing.",
    },
  ],
  'For Buyers': [
    {
      q: 'When does my payment actually reach the seller?',
      a: 'Only after you approve the delivered work. Until then, it sits in escrow — if something goes wrong, you can raise a dispute instead of losing your money.',
    },
    {
      q: 'Can I message a seller before ordering?',
      a: "Yes. Messaging is built for exactly that — but links, phone numbers, and email addresses can't be shared in-thread, to keep your order (and your payment protection) inside the platform.",
    },
    {
      q: "What if the delivered work isn't what I asked for?",
      a: 'Open a dispute from your order. Our team reviews the agreed brief and the delivered work before releasing or refunding payment.',
    },
  ],
  'For Sellers': [
    {
      q: 'How long does verification take?',
      a: "It's reviewed by a person on our team, not an algorithm — most applications are reviewed within a few business days.",
    },
    {
      q: 'What do I need to submit?',
      a: 'A government ID or business registration document, a short profile describing what you offer, and the service categories you work in.',
    },
    {
      q: 'When do I get paid?',
      a: 'As soon as the buyer approves your delivery, escrow releases the payment to you. If a buyer goes silent, our team can step in to review the order.',
    },
  ],
};

export default function HomeFAQ() {
  const [activeTab, setActiveTab] = useState<Tab>('General');
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="border-t border-[#ded6ca] bg-[#f7f3ec] text-[#1c1b18]">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <p className="mb-3 text-sm font-medium tracking-[0.2em] text-[#c65318]">FAQS</p>
        <h2 className="mb-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">
          Everything you need to know.
        </h2>
        <p className="mb-10 text-lg text-[#625c54] sm:text-xl">
          Can&apos;t find what you&apos;re looking for?{' '}
          <a href="mailto:hello@themiddleman.com.ng" className="text-[#1c1b18] underline decoration-[#f26419] underline-offset-4">Reach out to our team</a>.
        </p>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-[#ded6ca]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setOpenIndex(0); }}
              className={
                'whitespace-nowrap border-b-2 px-4 py-3 text-base transition-colors ' +
                (activeTab === tab
                  ? 'border-ember font-medium text-[#1c1b18]'
                  : 'border-transparent text-[#6f6a63] hover:text-[#1c1b18]')
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {QUESTIONS[activeTab].map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q} className="overflow-hidden rounded-xl border border-[#ded6ca] bg-white">
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium text-[#1c1b18] sm:text-lg">{item.q}</span>
                  <span className={`shrink-0 text-[#f26419] transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-base leading-relaxed text-[#625c54]">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
