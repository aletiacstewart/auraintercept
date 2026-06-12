import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send, Mic, CheckCircle2, Shield, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VoiceChat } from '@/components/ai/VoiceChat';
import { AuraCharacter } from '@/components/aura/AuraAvatarChat';
import { SEO } from '@/components/seo/SEO';

const AURA_COMPANY_ID = '04c57cbe-358e-4036-a3ad-b777a55f5be0';
const AURA_COMPANY_NAME = 'Aura Intercept';
const CONSULTATION_PHONE = '512-737-2424';
const CONSULTATION_PHONE_MNEMONIC = '512-REP-AiAi';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  service_interest: z.string().optional(),
  notes: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [useTextMode, setUseTextMode] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [auraSpeaking, setAuraSpeaking] = useState(false);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    setTranscript(prev => [...prev, { role, text }]);
    if (role === 'assistant') {
      setAuraSpeaking(true);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      speakingTimerRef.current = setTimeout(() => setAuraSpeaking(false), 1400);
    }
  }, []);

  useEffect(() => () => {
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
  }, []);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company_name: '',
      service_interest: '',
      notes: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // For now, just log the submission and show success
      // In production, this would be sent to an edge function or CRM
      console.log('Contact form submission:', data);
      
      toast({
        title: 'Message Received!',
        description: "Thank you for reaching out. We'll get back to you within 24 hours.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Contact Aura Intercept | Talk to Aura"
        description="Talk to Aura by voice, message us, or call our team. Get a live walkthrough demo tailored to your service business."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Aura Intercept",
          url: "https://auraintercept.ai",
          address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX", addressCountry: "US" },
        }}
      />
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Questions about Aura Intercept? We're here to help.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form + supporting cards */}
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll respond within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(512) 555-1234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Company LLC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="service_interest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What are you interested in?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="starter">Aura Core — $497/mo (was $697 · Beta Pricing)</SelectItem>
                                <SelectItem value="connect">Aura Boost — $994/mo (was $1,394 · Beta Pricing)</SelectItem>
                                <SelectItem value="performance">Aura Pro — $1,988/mo (was $2,788 · Beta Pricing)</SelectItem>
                                <SelectItem value="command">Aura Elite — $3,979/mo (was $5,576 · Beta Pricing)</SelectItem>
                                <SelectItem value="other">Other / Not Sure</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your business and how we can help..." 
                                rows={3}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      What to Expect
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      'Personalized demo of Aura Intercept',
                      'Discussion of your business needs',
                      'Custom pricing for your team size',
                      'Implementation timeline review',
                      'Q&A with our specialists',
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
                    <p className="mb-4 opacity-90">
                      60-Day Live Trial: 30 days concierge onboarding + 30 days fully live.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/auth?mode=company')}
                    >
                      60-Day Live Trial
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info & AI Options */}
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Phone</p>
                        <a href="tel:512-737-2424" className="text-muted-foreground hover:text-primary">
                          512-737-2424 (512-REP-AiAi)
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Email</p>
                        <a href="mailto:auraintercept@gmail.com" className="text-muted-foreground hover:text-primary">
                          auraintercept@gmail.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-muted-foreground">Austin, Texas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule by Phone */}
                <Card className="border-amber-500/40">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-amber-600" />
                      Schedule by Phone
                    </CardTitle>
                    <CardDescription>
                      Speak directly with our team to schedule your consultation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <a
                        href={`tel:${CONSULTATION_PHONE}`}
                        className="block text-3xl font-bold text-amber-600 hover:text-amber-500 transition-colors"
                      >
                        {CONSULTATION_PHONE}
                      </a>
                      <p className="text-amber-600/80 text-sm mt-2 font-medium">
                        ({CONSULTATION_PHONE_MNEMONIC})
                      </p>
                    </div>
                    <a
                      href={`tel:${CONSULTATION_PHONE}`}
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Call Now
                    </a>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Business Hours</p>
                        <p className="text-xs text-muted-foreground">Mon-Fri: 9AM - 6PM CST</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Talk to Aura (Voice) */}
                <Card className="border-primary/40">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      Talk to Aura (Voice)
                    </CardTitle>
                    <CardDescription>
                      Use voice chat to schedule your consultation instantly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <AuraCharacter
                        size={140}
                        connected={transcript.length > 0}
                        speaking={auraSpeaking}
                        mouthOpen={auraSpeaking ? 0.6 : 0.15}
                        expression="happy"
                      />
                      <div className="text-center">
                        <div className="text-sm font-semibold text-foreground">Aura</div>
                        <div className="text-xs text-muted-foreground">Your AI receptionist</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/30 flex items-start gap-2">
                      <Mic className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs leading-relaxed">
                        <span className="font-semibold text-primary">Tip:</span>{' '}
                        Tell Aura your industry (HVAC, plumbing, real estate, etc.) and she'll text
                        you a one-tap link to a live walkthrough demo pre-loaded for your business.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted border border-border">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="voice-terms"
                          checked={termsAgreed}
                          onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor="voice-terms"
                          className="text-sm font-normal leading-relaxed cursor-pointer"
                        >
                          I agree to the{' '}
                          <Link
                            to="/terms-of-service"
                            target="_blank"
                            className="text-primary hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms of Service
                          </Link>
                          {' '}and{' '}
                          <Link
                            to="/privacy-policy"
                            target="_blank"
                            className="text-primary hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>
                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border">
                        <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Your conversation may be recorded for quality assurance. Voice data is processed securely via ElevenLabs.
                        </p>
                      </div>
                    </div>

                    <div className={cn(
                      "transition-opacity duration-300",
                      !termsAgreed && "opacity-50 pointer-events-none"
                    )}>
                      <VoiceChat
                        companyId={AURA_COMPANY_ID}
                        companyName={AURA_COMPANY_NAME}
                        onTranscript={handleTranscript}
                        testMode={useTextMode}
                      />
                      <div className="flex justify-center mt-3">
                        <button
                          type="button"
                          onClick={() => setUseTextMode((v) => !v)}
                          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          {useTextMode ? "Switch to voice mode" : "Use text mode instead (no voice credits)"}
                        </button>
                      </div>
                    </div>

                    {!termsAgreed && (
                      <p className="text-xs text-center text-muted-foreground">
                        Please agree to the terms above to start voice chat
                      </p>
                    )}

                    {transcript.length > 0 && (
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium mb-2">Transcript</p>
                        <ScrollArea className="h-[150px]">
                          <div className="space-y-2">
                            {transcript.map((msg, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "text-sm p-2 rounded",
                                  msg.role === 'user'
                                    ? 'bg-muted ml-4'
                                    : 'bg-primary/10 mr-4'
                                )}
                              >
                                <span className="font-medium">
                                  {msg.role === 'user' ? 'You: ' : 'Aura: '}
                                </span>
                                {msg.text}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Call Aura's Mobile */}
                <Card className="border-primary/40">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Call Aura's Mobile
                    </CardTitle>
                    <CardDescription>
                      Reach Aura directly on her dedicated mobile line
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 rounded-lg bg-primary/10 border border-primary/30">
                      <a
                        href="tel:484-737-2424"
                        className="block text-3xl font-bold text-primary hover:opacity-80 transition-opacity"
                      >
                        484-737-2424
                      </a>
                    </div>
                    <a
                      href="tel:484-737-2424"
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-semibold transition-opacity"
                    >
                      <Phone className="w-5 h-5" />
                      Call Aura Now
                    </a>
                  </CardContent>
                </Card>

              </div>
            </div>

          </div>
        </section>
      </main>
      
      <PublicFooter />
    </div>
  );
}
