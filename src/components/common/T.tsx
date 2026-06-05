import { ReactNode } from 'react';
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
export function T({ children, as: Tag = 'span', className }: TProps): ReactNode {
  const translated = useAutoTranslate(children);
  // @ts-expect-error dynamic tag
  return <Tag className={className}>{translated}</Tag>;
}

export default T;