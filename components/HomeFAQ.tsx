"use client";

import { useState } from "react";

const QUESTIONS = [
  {
    question: "What can I buy on The Middleman?",
    answer: "The marketplace is being shaped around ready-made digital products such as templates, creative resources and tools. Check each listing for its exact contents, format and terms.",
  },
  {
    question: "How do payments work?",
    answer: "Eligible purchases use Paystack checkout. The Middleman does not currently claim escrow, held funds or guaranteed refunds. Check the listing and purchase terms before paying.",
  },
  {
    question: "Can I buy and sell with one account?",
    answer: "Yes. You can browse and buy, then set up your seller profile when you are ready to list a digital product.",
  },
  {
    question: "Can a creator customize a product for me?",
    answer: "Product-specific customization add-ons are in development. They will be available only when the product listing, checkout price and delivery flow are connected. If an option is not shown on the listing, it is not included in checkout.",
  },
  {
    question: "Where can I follow my purchase?",
    answer: "Use the order page to check the payment state and the information available for that order. Seller-managed delivery is still being verified for production.",
  },
];

export default function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[.8fr_1.2fr] md:gap-16">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[.14em] text-[#0B3D91]">Frequently asked</p>
          <h2 className="mt-4 max-w-sm font-display text-[1.85rem] font-semibold leading-[1.08] tracking-[-.055em] text-[#172B45] sm:text-[clamp(2.8rem,5vw,4.25rem)] sm:leading-[1.02]">Good questions.<br />Clear answers.</h2>
          <p className="mt-4 max-w-sm text-[17px] leading-7 text-[#6C7A87]">What to expect when you shop or sell digital products here.</p>
          <a href="mailto:hello@themiddleman.com.ng" className="mt-5 inline-flex text-[16px] font-semibold text-[#0B3D91] underline decoration-[#FF8A00] underline-offset-4">Talk to the team</a>
        </div>

        <div className="border-t border-[#DCE2E5]">
          {QUESTIONS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="border-b border-[#DCE2E5]">
                <button
                  type="button"
                  id={`faq-question-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]"
                >
                  <span className="text-[17px] font-semibold text-[#253E55] sm:text-[18px]">{item.question}</span>
                  <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#DCE2E5] text-base font-normal text-[#496277] transition-transform ${isOpen ? "rotate-45 bg-[#0B3D91] text-white" : ""}`}>+</span>
                </button>
                <p id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={!isOpen} className="max-w-2xl pb-5 pr-10 text-[16px] leading-7 text-[#6B7A87] sm:text-[17px]">{item.answer}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
