"use client";

import { useState } from "react";
import Link from "next/link";

const QUESTIONS = [
  {
    question: "How do payments work?",
    answer: "Purchases are paused on this launch. Listings show a price in Naira, and checkout does not take a payment. The terms describe how payment is meant to work once it is enabled.",
  },
  {
    question: "How does payment protection work?",
    answer: "No payment is held right now, because checkout is not open. The terms and refund policy describe the escrow rules that would apply once payments are enabled. Those pages are the written policy. This launch does not collect or hold money.",
  },
  {
    question: "Can I get a refund?",
    answer: "A refund applies to a payment that was taken. Checkout is paused, so there is no new payment to refund. The refund policy is the written rule for when payments are enabled.",
  },
  {
    question: "Who owns the licence after I buy?",
    answer: "The terms say ownership transfers after full payment and delivery approval, unless the listing says otherwise. Purchases are paused, so that transfer does not happen on this launch.",
  },
  {
    question: "How do downloads and delivery work?",
    answer: "File delivery follows a paid order. Purchases are paused, so there is no download to collect. Sellers still describe formats and contents on the listing.",
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
          <p className="mt-4 max-w-sm text-[16px] leading-7 text-slate">Answers for this browse-only launch. The legal pages are unchanged and describe the rules for when payments are enabled.</p>
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
