"use client";

import { useState } from "react";

const QUESTIONS = [
  {
    question: "What is The Middleman?",
    answer: "A marketplace for digital products and services from Nigerian creators. Buyers can discover listings and keep the order, payment and delivery steps together.",
  },
  {
    question: "How does payment protection work?",
    answer: "Payment is held while the seller completes the agreed work. The buyer reviews the delivery before approving the order and releasing payment.",
  },
  {
    question: "Can I buy and sell with one account?",
    answer: "Yes. You can browse and buy, then set up your seller profile when you are ready to offer products or services.",
  },
  {
    question: "How are AI-assisted listings shown?",
    answer: "Listings that use AI assistance are labelled so buyers can see that before they choose.",
  },
  {
    question: "What if I need help with an order?",
    answer: "Use the order page to review its progress or raise an issue for the team to look into.",
  },
];

export default function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-[#DCE2E5] bg-white">
      <div className="mx-auto grid max-w-7xl gap-9 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[.8fr_1.2fr] md:gap-16">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[.14em] text-[#0B3D91]">Frequently asked</p>
          <h2 className="mt-4 max-w-sm font-display text-4xl font-bold leading-[1.08] tracking-[-.05em] text-[#172B45] sm:text-5xl">Good questions.<br />Clear answers.</h2>
          <p className="mt-4 max-w-sm text-lg leading-6 text-[#6C7A87]">A few basics about finding work, paying safely and getting an order completed.</p>
          <a href="mailto:hello@themiddleman.com.ng" className="mt-5 inline-flex text-lg font-semibold text-[#0B3D91] underline decoration-[#FF8A00] underline-offset-4">Talk to the team</a>
        </div>

        <div className="border-t border-[#DCE2E5]">
          {QUESTIONS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className="border-b border-[#DCE2E5]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91]"
                >
                  <span className="text-lg font-semibold text-[#253E55] sm:text-[15px]">{item.question}</span>
                  <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#DCE2E5] text-base font-normal text-[#496277] transition-transform ${isOpen ? "rotate-45 bg-[#0B3D91] text-white" : ""}`}>+</span>
                </button>
                {isOpen && <p className="max-w-2xl pb-5 pr-10 text-lg leading-6 text-[#6B7A87]">{item.answer}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
