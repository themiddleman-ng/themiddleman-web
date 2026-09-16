import { notFound } from 'next/navigation';
import Link from 'next/link';

type LegalDocument = {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
};

const LEGAL_DOCS: Record<string, LegalDocument> = {
  terms: {
    title: 'Terms of Service',
    updated: 'September 2026',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By creating an account, accessing, or using The Middleman platform ("the Platform"), you ("the User") unconditionally agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. These terms constitute a legally binding agreement between you and The Middleman, registered in Nigeria.' },
      { heading: '2. Nature of the Platform', body: 'The Middleman is a digital marketplace that connects Nigerian buyers and sellers of digital products, code, templates, and services. The Platform acts solely as an intermediary and escrow agent. We do not create, own, or deliver the products listed. All transactions are governed by the escrow mechanism described herein.' },
      { heading: '3. Account Registration & Verification', body: 'Users must provide accurate, current, and complete information during registration. Sellers must complete identity verification before publishing listings. You are solely responsible for maintaining the confidentiality of your credentials. One account per person. Impersonation, fake identities, or misrepresentation will result in immediate termination without refund of pending fees.' },
      { heading: '4. Escrow Payment Mechanism', body: 'All payments on The Middleman are held in escrow. When a buyer places an order, the full amount is deducted and held by The Middleman. Funds are released to the seller ONLY after: (a) the buyer explicitly approves the delivery, or (b) the dispute resolution period expires without a claim, or (c) a dispute is resolved in the seller\'s favour. The Middleman reserves the right to hold funds for up to 14 days post-approval for fraud prevention.' },
      { heading: '5. Buyer Obligations', body: 'Buyers must: (a) provide clear requirements to the seller before work begins; (b) review deliverables within 72 hours of delivery notification; (c) not request work outside the agreed scope without a new order; (d) not share contact details, links, or attempt to transact outside the Platform. Failure to respond within 72 hours constitutes automatic approval of delivery.' },
      { heading: '6. Seller Obligations', body: 'Sellers must: (a) deliver work that matches the listing description; (b) deliver within the stated timeframe; (c) not include malicious code, stolen assets, or plagiarised content; (d) not communicate outside the Platform; (e) clearly label AI-assisted work where applicable. Sellers who fail to deliver may have their escrow funds returned to the buyer and their account suspended.' },
      { heading: '7. Prohibited Conduct', body: 'The following are strictly prohibited and grounds for immediate termination: (a) sharing phone numbers, emails, social handles, or external links in messages; (b) attempting to complete transactions outside the Platform; (c) submitting fraudulent deliverables; (d) creating multiple accounts; (e) using the Platform for money laundering; (f) harassment, threats, or discriminatory language; (g) reverse-engineering the Platform.' },
      { heading: '8. Fees & Commission', body: 'The Middleman charges a service commission on each completed transaction, deducted from the seller\'s payout before release. The current commission rate is displayed at checkout. Buyers pay the listed product price plus any applicable payment processing fees. All prices are in Nigerian Naira (₦).' },
      { heading: '9. Intellectual Property', body: 'Upon full payment and delivery approval, ownership of the delivered digital product transfers from seller to buyer, unless otherwise stated in the listing. Sellers retain the right to showcase work in their portfolio unless bound by an NDA. The Middleman retains no ownership of user-generated content but is granted a non-exclusive licence to display listings for Platform operations.' },
      { heading: '10. Dispute Resolution', body: 'Disputes must be raised within 72 hours of delivery notification. The Middleman\'s mediation team will review evidence from both parties within 5 business days. Decisions are final and binding. If mediation fails, parties may pursue resolution through the Lagos Multi-Door Courthouse or applicable Nigerian courts. The Platform\'s decision on escrow release during disputes is final.' },
      { heading: '11. Limitation of Liability', body: 'The Middleman provides the Platform "as is" without warranties of any kind. We do not guarantee the quality, accuracy, or fitness of any product listed. Our total liability for any claim shall not exceed the Platform fees collected from the specific transaction giving rise to the claim. We are not liable for indirect, incidental, or consequential damages.' },
      { heading: '12. Termination', body: 'We may suspend or terminate your account at any time for breach of these terms, suspected fraud, or inactivity exceeding 12 months. Upon termination: (a) active escrow transactions will be resolved per Section 10; (b) seller listings will be removed; (c) you remain liable for any outstanding obligations. You may request account deletion by contacting support.' },
      { heading: '13. Governing Law', body: 'These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these terms or use of the Platform shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.' },
      { heading: '14. Amendments', body: 'The Middleman reserves the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance. Material changes will be communicated via email or in-app notification 7 days before taking effect.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'September 2026',
    sections: [
      { heading: '1. Data Controller', body: 'The Middleman ("we", "us", "our") is the data controller for all personal information collected through the Platform. We are committed to protecting your privacy in compliance with the Nigeria Data Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act 2023.' },
      { heading: '2. Information We Collect', body: 'We collect: (a) Account data: name, email, phone number, state of residence, password hash; (b) Identity data: government-issued ID for seller verification; (c) Transaction data: order history, payment amounts, delivery records; (d) Communication data: messages sent through the Platform; (e) Technical data: IP address, browser type, device information, usage analytics.' },
      { heading: '3. Purpose of Processing', body: 'We process your data to: (a) provide and maintain your account; (b) facilitate escrow transactions; (c) verify seller identities; (d) resolve disputes; (e) prevent fraud; (f) comply with legal obligations under Nigerian law; (g) improve Platform functionality. We do NOT sell your personal data to third parties.' },
      { heading: '4. Data Sharing', body: 'We share data only with: (a) payment processors to facilitate transactions; (b) identity verification services for seller onboarding; (c) law enforcement when required by valid legal process; (d) dispute mediators when a formal dispute is raised. All third-party processors are bound by data protection agreements.' },
      { heading: '5. Data Retention', body: 'Account data is retained while your account is active. Transaction records are retained for 7 years to comply with Nigerian financial regulations. Messages are retained for 2 years after the last activity. Upon account deletion, personal data is purged within 30 days, except where retention is required by law.' },
      { heading: '6. Your Rights (NDPR)', body: 'Under the NDPR, you have the right to: (a) access your personal data; (b) request correction of inaccurate data; (c) request deletion of your data; (d) object to processing; (e) data portability; (f) withdraw consent at any time. To exercise these rights, email hello@themiddleman.com.ng. We respond within 30 days.' },
      { heading: '7. Data Security', body: 'We implement industry-standard security measures including: encryption in transit (TLS 1.3), encryption at rest, role-based access control, regular security audits, and two-factor authentication for administrative access. No system is perfectly secure; we recommend using strong, unique passwords.' },
      { heading: '8. Cookies & Analytics', body: 'We use essential cookies for authentication and session management. We use privacy-respecting analytics to understand Platform usage. We do not use third-party advertising trackers. You can disable non-essential cookies in your browser settings without affecting core functionality.' },
      { heading: '9. Children\'s Privacy', body: 'The Middleman is not intended for users under 18. We do not knowingly collect data from minors. If we discover data from a minor, we will delete it promptly. Parents who believe their child has provided us data should contact us immediately.' },
      { heading: '10. International Transfers', body: 'Your data is stored on servers located in Nigeria and, where necessary, in jurisdictions with adequate data protection standards. Any international transfer complies with NDPR cross-border transfer requirements.' },
      { heading: '11. Changes to This Policy', body: 'We may update this policy periodically. Material changes will be notified via email 7 days before taking effect. Continued use after changes constitutes acceptance.' },
      { heading: '12. Contact & Complaints', body: 'For privacy concerns or complaints, contact: hello@themiddleman.com.ng. If unresolved, you may lodge a complaint with the Nigeria Data Protection Commission (NDPC).' },
    ],
  },
  refunds: {
    title: 'Refund & Dispute Policy',
    updated: 'September 2026',
    sections: [
      { heading: '1. Escrow-First Principle', body: 'All payments on The Middleman are held in escrow. This means your money is never released to the seller until you approve the delivery. If something goes wrong, your funds are protected. This is the foundation of trust on our Platform.' },
      { heading: '2. When You Can Request a Refund', body: 'You may request a full refund if: (a) the seller fails to deliver within the agreed timeframe plus a 48-hour grace period; (b) the delivery is materially different from the listing description; (c) the delivery contains malicious code, stolen assets, or plagiarised content; (d) the seller becomes unresponsive for more than 72 hours during an active order.' },
      { heading: '3. When Refunds Are NOT Applicable', body: 'Refunds will not be granted if: (a) you approved the delivery and more than 72 hours have passed; (b) you changed your mind after the seller completed the agreed scope; (c) you failed to provide required inputs and the seller delivered based on available information; (d) you attempted to transact outside the Platform.' },
      { heading: '4. Dispute Process', body: 'Step 1: Raise a dispute within 72 hours of delivery notification via the order page. Step 2: Both parties submit evidence (screenshots, files, messages). Step 3: Our mediation team reviews within 5 business days. Step 4: A decision is issued. Funds are released to the appropriate party. All decisions are final and binding.' },
      { heading: '5. Partial Delivery', body: 'If a seller delivers partial work that is usable, we may issue a partial refund proportional to the undelivered scope. The mediation team determines the fair split based on the original listing description and delivered assets.' },
      { heading: '6. Seller Non-Delivery', body: 'If a seller fails to deliver entirely, the full escrow amount is returned to the buyer within 3 business days of the dispute being confirmed. The seller receives a strike. Three strikes result in permanent account suspension.' },
      { heading: '7. Chargebacks & External Payment Disputes', body: 'Initiating a chargeback with your bank or payment provider while an active Platform dispute is pending will result in immediate account suspension. Allow the Platform dispute process to complete first.' },
      { heading: '8. Refund Processing Time', body: 'Approved refunds are processed within 3-5 business days to the original payment method. Bank processing times may add additional delay. We will notify you via email once the refund is initiated.' },
    ],
  },
  disputes: {
    title: 'Dispute Resolution',
    updated: 'September 2026',
    sections: [
      { heading: '1. Our Commitment', body: 'The Middleman is built on trust. When disagreements arise, we provide a fair, transparent, and timely resolution process. Our goal is to protect both buyers and sellers while ensuring the integrity of every transaction.' },
      { heading: '2. Raising a Dispute', body: 'Disputes must be raised within 72 hours of delivery notification. Navigate to your order page and click "Raise Dispute." Provide a clear description of the issue and any supporting evidence (screenshots, files, message history). Late disputes will not be accepted.' },
      { heading: '3. Evidence Requirements', body: 'For a dispute to be valid, you must provide: (a) the specific deliverable or listing section in question; (b) evidence of what was promised vs. what was delivered; (c) relevant message history from the Platform. External communications will not be considered as evidence.' },
      { heading: '4. Mediation Timeline', body: 'Day 1: Dispute raised, both parties notified. Day 2-3: Evidence collection window. Day 4-5: Mediation team review. Day 6-7: Decision issued. Total maximum resolution time: 7 business days. Complex cases may be extended by 3 additional days with notice.' },
      { heading: '5. Possible Outcomes', body: 'After review, one of the following will occur: (a) Full refund to buyer; (b) Partial refund with remainder released to seller; (c) Full release to seller (dispute dismissed); (d) Revision required: seller given 48 hours to fix the issue before final decision.' },
      { heading: '6. Escalation', body: 'If either party disagrees with the Platform decision, they may request one escalation review within 24 hours. The escalation is handled by a senior mediator not involved in the initial review. Escalation decisions are final and cannot be further appealed on the Platform.' },
      { heading: '7. Legal Recourse', body: 'The Platform dispute process does not waive your right to pursue legal action under Nigerian law. However, you must exhaust the Platform process first. For disputes exceeding ₦500,000, parties may elect to resolve through the Lagos Multi-Door Courthouse mediation programme.' },
      { heading: '8. Fraud & Bad Faith', body: 'Users who file fraudulent disputes, submit fabricated evidence, or act in bad faith during mediation will face immediate account suspension and forfeiture of any pending escrow funds. Repeat offenders will be permanently banned and reported to relevant authorities.' },
    ],
  },
  'seller-guidelines': {
    title: 'Seller Guidelines',
    updated: 'September 2026',
    sections: [
      { heading: '1. Becoming a Seller', body: 'To sell on The Middleman, you must: (a) have a verified account with valid Nigerian identification; (b) complete the seller onboarding process; (c) be approved by our verification team. Approval typically takes 1-3 business days. Rejected applications may reapply after 30 days.' },
      { heading: '2. Listing Standards', body: 'Your listings must: (a) accurately describe what the buyer will receive; (b) specify deliverable formats (e.g., Figma file, React code, PDF); (c) state realistic delivery times; (d) be priced in Nigerian Naira; (e) not contain misleading claims or stock imagery representing actual deliverables. Vague listings will be rejected.' },
      { heading: '3. AI-Assisted Work', body: 'If you use AI tools (ChatGPT, Midjourney, GitHub Copilot, etc.) as part of your delivery, you MUST check the "AI-assisted" flag when creating your gig. AI-assisted work is welcome on The Middleman, but buyers must be informed. Failure to disclose AI usage is grounds for dispute resolution in the buyer\'s favour.' },
      { heading: '4. Delivery Requirements', body: 'Deliveries must: (a) match the listing description; (b) be submitted within the stated timeframe; (c) include all files/assets promised; (d) be free of malware, watermarks, or lock mechanisms; (e) include a brief handover note explaining what was delivered and how to use it.' },
      { heading: '5. Communication Rules', body: 'All communication must happen within The Middleman messaging system. You may NOT: (a) share your phone number, email, or social media; (b) send external links; (c) request payment outside the Platform; (d) ask buyers to cancel orders and pay you directly. Violations result in immediate suspension.' },
      { heading: '6. Pricing & Fees', body: 'Set your price based on the value you deliver. The Middleman deducts a platform commission from your payout. Your listed price is what the buyer pays; your payout is the listed price minus commission. Commission rates are displayed before you publish.' },
      { heading: '7. Handling Disputes', body: 'If a buyer raises a dispute: (a) respond within 24 hours; (b) provide evidence of what you delivered; (c) remain professional. Aggressive or dismissive responses will be noted by mediators. If the dispute is resolved in your favour, funds release immediately.' },
      { heading: '8. Account Strikes', body: 'Strike 1: Warning + listing removed. Strike 2: 7-day suspension. Strike 3: Permanent ban + pending escrow funds held for 30 days. Strikes are issued for: non-delivery, fraudulent listings, communication violations, or repeated quality complaints.' },
      { heading: '9. Getting Unverified', body: 'Verified sellers receive a stamp badge, higher search ranking, and buyer trust. To maintain verified status: (a) maintain a 4.0+ average rating; (b) complete 90%+ of orders on time; (c) have zero unresolved disputes in the last 90 days. Falling below these thresholds triggers a review.' },
    ],
  },
  disclaimer: {
    title: 'Marketplace Disclaimer',
    updated: 'September 2026',
    sections: [
      { heading: '1. Platform Role', body: 'The Middleman is a marketplace intermediary and escrow agent. We facilitate transactions between independent buyers and sellers. We are NOT the seller of any product listed, NOT the employer of any seller, and NOT responsible for the quality, legality, or fitness of any product or service offered.' },
      { heading: '2. No Guarantee of Quality', body: 'While we verify seller identities and monitor listings, we cannot guarantee the quality, accuracy, or completeness of any deliverable. Buyers should review listings carefully, ask questions before purchasing, and use the dispute process if deliverables do not match descriptions.' },
      { heading: '3. AI-Assisted Content', body: 'Some products on The Middleman are created with AI assistance. These are clearly labelled. The Middleman does not verify the accuracy or originality of AI-generated content. Buyers purchasing AI-assisted products accept the inherent variability of AI outputs.' },
      { heading: '4. Third-Party Content', body: 'Listings may reference third-party tools, frameworks, or assets. The Middleman does not endorse or warrant any third-party products. Sellers are responsible for ensuring they have appropriate licences for any third-party assets included in deliveries.' },
      { heading: '5. Financial Disclaimer', body: 'The Middleman does not provide financial, legal, or professional advice. Transaction amounts are in Nigerian Naira. Exchange rates, bank fees, and payment processing fees may apply. The Middleman is not a licensed financial institution but operates escrow services under applicable Nigerian regulations.' },
      { heading: '6. Limitation of Liability', body: 'To the maximum extent permitted by Nigerian law, The Middleman shall not be liable for any indirect, incidental, special, or consequential damages arising from use of the Platform, including but not limited to loss of profits, data, or business opportunities. Our total liability is capped at the Platform fees collected from the specific transaction.' },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  const doc = LEGAL_DOCS[document];
  return { title: doc ? `${doc.title} — The Middleman` : 'Page Not Found — The Middleman' };
}

export default async function LegalPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  const doc = LEGAL_DOCS[document];

  if (!doc) notFound();

  return (
    <main className="min-h-screen bg-ink text-bone">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display font-bold text-lg tracking-tight flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-ember" />
            The Middleman
          </Link>
          <Link href="/" className="text-sm text-slate hover:text-bone transition-colors">← Back to Home</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[.16em] text-ember uppercase">Legal Document</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{doc.title}</h1>
          <p className="mt-3 text-sm text-slate">Last updated: {doc.updated}</p>
        </div>

        <div className="relative rounded-2xl border border-line bg-paper p-6 sm:p-10">
          <div className="absolute -left-2 top-1/2 w-4 h-4 rounded-full bg-ink border border-line -translate-y-1/2" />
          <div className="absolute -right-2 top-1/2 w-4 h-4 rounded-full bg-ink border border-line -translate-y-1/2" />

          <div className="space-y-8">
            {doc.sections.map((section, index) => (
              <div key={section.heading} className={index > 0 ? 'pt-6 border-t border-line' : ''}>
                <h2 className="font-display text-lg font-bold text-bone">{section.heading}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-dashed border-line flex items-center justify-between">
            <p className="text-xs text-slate font-mono">THE MIDDLEMAN · LAGOS, NIGERIA</p>
            <div className="ink-stamp rounded-md px-3 py-1 text-[10px]">OFFICIAL</div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {Object.entries(LEGAL_DOCS).map(([key, d]) => (
            <Link
              key={key}
              href={`/legal/${key}`}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                key === document
                  ? 'bg-ember text-ink'
                  : 'border border-line text-slate hover:border-ember/40 hover:text-bone'
              }`}
            >
              {d.title}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
