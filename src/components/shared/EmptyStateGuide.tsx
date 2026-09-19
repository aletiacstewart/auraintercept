import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateGuideProps {
  title: string;
  description: string;
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: ReactNode;
  };
  tips?: string[];
  /** Optional walkthrough link. Left unused until real videos exist. */
  videoUrl?: string;
  className?: string;
}

/**
 * Generic guidance block for screens that have no data yet.
 * Use IndustryEmptyState instead where industry-specific copy exists.
 */
export function EmptyStateGuide({
  title,
  description,
  action,
  tips,
  videoUrl,
  className,
}: EmptyStateGuideProps) {
  return (
    <Card
      className={cn(
        'flex min-h-80 flex-col items-center justify-center gap-4 border-dashed bg-card/40 p-8 text-center',
        className,
      )}
    >
      {action.icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {action.icon}
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>

      {videoUrl && (
        <a
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          <PlayCircle className="h-4 w-4" />
          Watch a short walkthrough
        </a>
      )}

      {tips && tips.length > 0 && (
        <div className="text-left text-sm">
          <p className="mb-1 font-medium text-foreground">Quick tips</p>
          <ul className="space-y-1 text-muted-foreground">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {action.href ? (
        <Button asChild size="lg">
          <Link to={action.href}>{action.label}</Link>
        </Button>
      ) : (
        <Button size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  );
}

export default EmptyStateGuide;
