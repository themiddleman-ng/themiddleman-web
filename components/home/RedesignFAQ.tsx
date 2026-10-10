'use client';

import { useState } from "react";

const ITEMS = [
  {
    q: "What is The Middleman?",
    a: "A marketplace for buying and selling digital products and services, with payment protected through the order until the agreed work is delivered.",
  },
  {
    q: "How does escrow protection work?",
    a: "The buyer pays through The Middleman. The payment is held while the seller completes the order, then released when the delivery is approved.",
  },
  {
    q: "Can I buy and sell with the same account?",
    a: "Yes. One account can buy from the marketplace and also become a seller when you are ready to publish your own work.",
  },
  {
    q: "Why are gigs reviewed before they go live?",
    a: "New listings are reviewed before publishing so the marketplace stays clear, useful, and easier for buyers to trust.",
  },
  {
    q: "What happens if something goes wrong with an order?",
    a: "The order keeps the payment and delivery trail together so the issue can be reviewed instead of relying on an informal deal outside the platform.",
  },
];

export default function RedesignFAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="border-t border-white/10 bg-[#0b0b0b] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8f8f8f]">Questions</p>
          <h2 className="mt-5 max-w-md font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {ITEMS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium text-white sm:text-lg">{item.q}</span>
                  <span className="text-xl font-light text-[#8f8f8f]">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-[#a8a8a8] sm:text-base">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
