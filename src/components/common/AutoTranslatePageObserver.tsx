import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCachedTranslation, shouldTranslate, translateText } from '@/lib/autoTranslate';

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE',
  'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'SVG', 'PATH',
]);

function shouldSkipNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  // Honor opt-out
  let el: HTMLElement | null = parent;
  while (el) {
    if (el.hasAttribute && el.hasAttribute('data-no-translate')) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Layer 2 fallback: walks the live DOM, finds plain English text nodes,
 * and replaces their value with AI translations when the locale is non-English.
 *
 * - Cached translations apply synchronously (no flicker).
 * - Uncached strings are batched to the translate-ui edge function.
 * - React re-renders are picked up via MutationObserver.
 * - Add `data-no-translate` on any element to opt out (e.g. logos, brand text).
 */
export function AutoTranslatePageObserver() {
  const { language } = useLanguage();

  useEffect(() => {
    if (language === 'en') return;
    const lang = language;
    // Track original English source per text node so re-translation after
    // React updates uses the canonical source string, not the previous translation.
    const sourceMap = new WeakMap<Text, string>();

    const handleNode = (node: Text) => {
      if (shouldSkipNode(node)) return;
      const current = node.nodeValue ?? '';
      const source = sourceMap.get(node) ?? current;
      if (!shouldTranslate(source)) return;

      // If React just rewrote this node with new English, refresh source.
      if (!sourceMap.has(node) || (current !== source && /[a-zA-Z]/.test(current) && current.trim() !== (sourceMap.get(node) ?? ''))) {
        sourceMap.set(node, current);
      }
      const useSource = sourceMap.get(node)!;

      const cached = getCachedTranslation(useSource, lang);
      if (cached) {
        if (node.nodeValue !== cached) node.nodeValue = cached;
        return;
      }
      translateText(useSource, lang).then((translated) => {
        // Only apply if this node still belongs to the same source
        if (sourceMap.get(node) === useSource && node.isConnected) {
          node.nodeValue = translated;
        }
      });
    };

    const walk = (root: Node) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      // eslint-disable-next-line no-cond-assign
      while ((n = w.nextNode())) handleNode(n as Text);
    };

    // Initial pass
    walk(document.body);

    let pending = false;
    const queued = new Set<Text>();
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
          queued.add(m.target as Text);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              queued.add(node as Text);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
              let t: Node | null;
              // eslint-disable-next-line no-cond-assign
              while ((t = w.nextNode())) queued.add(t as Text);
            }
          });
        }
      }
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          queued.forEach(handleNode);
          queued.clear();
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}

export default AutoTranslatePageObserver;