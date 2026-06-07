import React, { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  Mic, 
  MessageSquare, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2,
  Shield,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceChat } from '@/components/ai/VoiceChat';
import { Link } from 'react-router-dom';

// Aura Intercept company ID for demo purposes
const AURA_COMPANY_ID = 'aura-intercept-demo';
const AURA_COMPANY_NAME = 'Aura Intercept';

// REP-AI phone number
const CONSULTATION_PHONE = '512-737-2424';
const CONSULTATION_PHONE_MNEMONIC = '512-REP-AiAi';

export default function TalkToAura() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tier = searchParams.get('tier') || 'command';
  
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [voiceStarted] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);

  const handleTranscript = useCallback((role: 'user' | 'assistant', text: string) => {
    setTranscript(prev => [...prev, { role, text }]);
  }, []);

  const tierLabels: Record<string, string> = {
    starter: 'Aura Core',
    connect: 'Aura Boost',
    performance: 'Aura Pro',
    command: 'Aura Elite',
  };

  const tierLabel = tierLabels[tier] || 'Aura Elite';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold">Talk to Aura (Voice)</span>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              {tierLabel} Consultation
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Phone & Info */}
          <div className="space-y-6">
            {/* Phone Number Card */}
            <Card className="bg-slate-800/50 border-amber-500/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-amber-400" />
                  Schedule by Phone
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Speak directly with our team to schedule your consultation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30">
                  <a 
                    href={`tel:${CONSULTATION_PHONE}`}
                    className="block text-3xl font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {CONSULTATION_PHONE}
                  </a>
                  <p className="text-amber-300/80 text-sm mt-2 font-medium">
                    ({CONSULTATION_PHONE_MNEMONIC})
                  </p>
                </div>
                
                <a
                  href={`tel:${CONSULTATION_PHONE}`}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50">
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-300 font-medium">Business Hours</p>
                    <p className="text-xs text-slate-400">Mon-Fri: 9AM - 6PM CST</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
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
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Voice Chat */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-primary/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" />
                  Talk to Aura (Voice)
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Use voice chat to schedule your consultation instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-start gap-2">
                  <Mic className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <span className="font-semibold text-primary">Tip:</span>{' '}
                    Tell Aura your industry (HVAC, plumbing, real estate, etc.) and she'll text
                    you a one-tap link to a live walkthrough demo pre-loaded for your business.
                  </p>
                </div>
                {/* Terms Agreement - with proper visibility */}
                {!voiceStarted && (
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="voice-terms" 
                        checked={termsAgreed} 
                        onCheckedChange={(checked) => setTermsAgreed(checked === true)}
                        className="mt-0.5 border-slate-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label 
                        htmlFor="voice-terms" 
                        className="text-sm font-normal text-slate-200 leading-relaxed cursor-pointer"
                      >
                        I agree to the{' '}
                        <Link 
                          to="/terms-of-service" 
                          target="_blank"
                          className="text-primary hover:text-primary/80 hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link 
                          to="/privacy-policy" 
                          target="_blank"
                          className="text-primary hover:text-primary/80 hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                    
                    <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-600/50">
                      <Shield className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-400">
                        Your conversation may be recorded for quality assurance. Voice data is processed securely via ElevenLabs.
                      </p>
                    </div>
                  </div>
                )}

                {/* Voice Chat Component */}
                <div className={cn(
                  "transition-opacity duration-300",
                  !termsAgreed && !voiceStarted && "opacity-50 pointer-events-none"
                )}>
                  <VoiceChat
                    companyId={AURA_COMPANY_ID}
                    companyName={AURA_COMPANY_NAME}
                    onTranscript={handleTranscript}
                    testMode={true}
                  />
                </div>

                {!termsAgreed && !voiceStarted && (
                  <p className="text-xs text-center text-slate-400">
                    Please agree to the terms above to start voice chat
                  </p>
                )}

                {/* Transcript Display */}
                {transcript.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-sm font-medium text-slate-300 mb-2">Transcript</p>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {transcript.map((msg, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "text-sm p-2 rounded",
                              msg.role === 'user' 
                                ? 'bg-slate-700/50 ml-4 text-slate-200' 
                                : 'bg-primary/10 mr-4 text-slate-200'
                            )}
                          >
                            <span className="font-medium text-slate-300">
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

            {/* Alternative: Text Chat */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-300 font-medium">Prefer text?</p>
                      <p className="text-xs text-slate-400">Use Message Aura (Text) instead</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/chat/aura-intercept')}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Open Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
