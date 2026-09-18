"use client";

import { useEffect, useState } from "react";

interface NavItem {
  id: string;
  label: string;
}

/**
 * Menu fixo no topo com o nome da marca e âncoras para as seções
 * principais — padrão observado no material de referência (Senna
 * Building). Destaca a seção atualmente visível usando IntersectionObserver.
 */
export function SiteNav({ items }: { items: NavItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      className={
        "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-[7vw] py-5 transition-colors duration-300 " +
        (scrolled
          ? "bg-brand-cream/90 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-transparent")
      }
    >
      <a
        href="#top"
        className="font-serif text-[19px] uppercase tracking-[0.22em] text-brand-charcoal no-underline md:text-[22px]"
      >
        Amanda Pioner
      </a>
      <ul className="hidden gap-7 md:flex">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={
                "text-[10px] uppercase tracking-[0.2em] transition-opacity " +
                (activeId === item.id
                  ? "text-brand-charcoal opacity-100"
                  : "text-brand-sage opacity-80 hover:opacity-100")
              }
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
