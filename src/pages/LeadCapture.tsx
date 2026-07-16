import { useState } from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Play, User } from 'lucide-react';
import { format } from 'date-fns';
import { SEO } from '@/components/seo/SEO';
import charlesPromo from '@/assets/charles-perez-promo.mp4.asset.json';

type PromoVideo = {
  id: string;
  title: string;
  author: string;
  role: string;
  description: string;
  publishedAt: string; // ISO
  src: string;
};

const PROMO_VIDEOS: PromoVideo[] = [
  {
    id: 'charles-perez-intro',
    title: 'Aura Intercept in Action',
    author: 'Charles Perez',
    role: 'Owner',
    description:
      'A walkthrough from the founder — how Aura Intercept captures every call, lead, and booking so service businesses never miss revenue again.',
    publishedAt: new Date().toISOString(),
    src: charlesPromo.url,
  },
];

export default function VideoBlog() {
  const [active, setActive] = useState<PromoVideo | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Video Blog | Aura Intercept"
        description="Promo videos, product walkthroughs, and founder updates from Aura Intercept."
        path="/video-blog"
      />
      <PublicHeader />

      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Aura Intercept Video Blog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Product walkthroughs, founder updates, and promo videos from the Aura Intercept team.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROMO_VIDEOS.map((v) => (
                <Card
                  key={v.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => setActive(v)}
                >
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video
                      src={v.src}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="rounded-full bg-primary/90 p-4 shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-primary-foreground fill-current" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h2 className="text-lg font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {v.title}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="h-4 w-4" />
                      <span>
                        {v.author} — {v.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{v.description}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <time dateTime={v.publishedAt}>{format(new Date(v.publishedAt), 'MMM d, yyyy')}</time>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background">
          {active && (
            <>
              <DialogHeader className="px-6 pt-6">
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>
                  {active.author} — {active.role}
                </DialogDescription>
              </DialogHeader>
              <div className="w-full bg-black flex items-center justify-center">
                <video
                  key={active.id}
                  src={active.src}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[75vh] object-contain"
                />
              </div>
              {active.description && (
                <div className="px-6 pb-6 pt-4 text-sm text-muted-foreground">{active.description}</div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
