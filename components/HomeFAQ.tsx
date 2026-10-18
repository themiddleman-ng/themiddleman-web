"use client";

import { useState } from "react";
import Link from "next/link";

const QUESTIONS = [
  {
    question: "How do payments work?",
    answer: "Eligible purchases use Paystack checkout in Nigerian Naira. Buyers pay the listed price plus any processing fees shown at checkout. Purchases are paused while payment and delivery are verified.",
  },
  {
    question: "How does payment protection work?",
    answer: "All payments on The Middleman are held in escrow. When a buyer places an order, the full amount is deducted and held by The Middleman. Your money is never released to the seller until you approve the delivery. If something goes wrong, your funds are protected.",
  },
  {
    question: "Can I get a refund?",
    answer: "The refund policy allows a request if a seller fails to deliver, the delivery is materially different from the listing, the files are unsafe, or the seller is unresponsive during an active order. Read the refund policy before paying.",
  },
  {
    question: "Who owns the licence after I buy?",
    answer: "Upon full payment and delivery approval, ownership of the delivered digital product transfers from seller to buyer, unless the listing says otherwise. Sellers remain responsible for third-party licences included in a delivery.",
  },
  {
    question: "How do downloads and delivery work?",
    answer: "Sellers must deliver what the listing describes, in the stated formats, within the stated timeframe, and without malware or lock mechanisms. Payment confirmation and product delivery are separate steps. Use your order page to check the status available for your purchase.",
  },
  {
    question: "What can I buy here?",
    answer: "The marketplace lists ready-made digital products such as code, templates and creative work. Each listing is the source of truth for contents, formats and terms.",
  },
];

export default function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-paper">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-14 sm:px-8 sm:py-16 md:grid-cols-[.8fr_1.2fr] md:gap-16">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[.14em] text-eyebrow">Frequently asked</p>
          <h2 className="mt-4 max-w-sm font-display text-[1.85rem] font-semibold leading-[1.08] tracking-[-.055em] text-bone sm:text-[clamp(2.4rem,4vw,3.4rem)] sm:leading-[1.02]">Good questions.</h2>
          <p className="mt-4 max-w-sm text-[16px] leading-7 text-slate">Answers from the current legal pages and the live payment flow.</p>
          <Link href="/legal/terms" className="mt-5 inline-flex min-h-11 items-center text-[16px] font-semibold text-eyebrow underline underline-offset-4">Read the terms</Link>
        </div>

        <div className="border-t border-line">
          {QUESTIONS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="border-b border-line">
                <button
                  type="button"
                  id={`faq-question-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="flex min-h-11 w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[16px] font-semibold text-bone sm:text-[17px]">{item.question}</span>
                  <span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-base font-normal text-bone transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                </button>
                <p id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={!isOpen} className="max-w-2xl pb-5 pr-10 text-[16px] leading-7 text-slate">{item.answer}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
