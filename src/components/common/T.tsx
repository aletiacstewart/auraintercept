import { createElement } from 'react';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';

interface TProps {
  children: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Drop-in auto-translating wrapper for plain string children.
 *   <T>Save changes</T>
 *   <T as="span" className="text-sm">Loading…</T>
 */
export function T({ children, as = 'span', className }: TProps) {
  const translated = useAutoTranslate(children);
  return createElement(as, { className }, translated);
}

export default T;