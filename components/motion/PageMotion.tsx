'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Scroll entrances progressively enhance content that is always visible in HTML. */
export default function PageMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches || !('IntersectionObserver' in window)) return;
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const selector = 'main > section, main section[id], .gm-card';
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (media.matches || !('animate' in entry.target)) return;
        const element = entry.target as HTMLElement;
        const siblings = element.parentElement ? [...element.parentElement.children] : [];
        const delay = element.classList.contains('gm-card') ? Math.max(0, siblings.indexOf(element) % 4) * 65 : 0;
        const animation = element.animate([{ opacity: .15, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => {});
      });
    }, { threshold: .04 });
    function watch(element: Element) {
      if (element.matches(selector) && !seen.has(element)) { seen.add(element); observer.observe(element); }
      element.querySelectorAll(selector).forEach(child => { if (!seen.has(child)) { seen.add(child); observer.observe(child); } });
    }
    watch(document.body);
    const mutations = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node instanceof Element) watch(node); })));
    mutations.observe(document.body, { childList: true, subtree: true });
    const stop = () => { if (media.matches) animations.forEach(animation => animation.cancel()); };
    media.addEventListener('change', stop);
    return () => { observer.disconnect(); mutations.disconnect(); animations.forEach(animation => animation.cancel()); media.removeEventListener('change', stop); };
  }, [pathname]);
  return null;
}
