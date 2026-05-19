import { useNavigate } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  Shield, 
  Users, 
  Heart, 
  Target, 
  Lightbulb, 
  ArrowRight,
  MapPin
} from 'lucide-react';
import logo from '@/assets/aura-intercept-logo.png';
import { SEO } from '@/components/seo/SEO';

const coreValues = [
  {
    icon: Shield,
    title: 'Reliability',
    description: 'Our AI operatives work 24/7, ensuring your business never misses a beat. Consistent, dependable automation you can count on.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We stay at the forefront of AI technology, continuously improving our platform to deliver cutting-edge solutions.',
  },
  {
    icon: Users,
    title: 'Partnership',
    description: "Your success is our success. We work alongside you as partners, not just vendors, to achieve your business goals.",
  },
  {
    icon: Heart,
    title: 'Care',
    description: 'We genuinely care about the businesses we serve. Every feature, every update is designed with your needs in mind.',
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="About Aura Intercept | AI for Service Businesses"
        description="Aura Intercept democratizes AI automation for appointment-based service businesses with 24 specialized operatives."
        path="/about"
      />
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Democratizing AI for Service Businesses
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  We believe every appointment-based business deserves access to powerful AI automation—not just the enterprise giants.
                </p>
                <Button size="lg" onClick={() => navigate('/auth?mode=company')}>
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              <div className="flex-shrink-0">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl gradient-primary p-1 shadow-2xl">
                  <div className="w-full h-full rounded-3xl bg-card flex items-center justify-center">
                    <img src={logo} alt="Aura Intercept" className="w-32 h-32 md:w-48 md:h-48" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-card">
          <div className="container max-w-4xl mx-auto px-6 text-center">
            <Target className="h-12 w-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              To empower service businesses with intelligent AI operatives that handle the repetitive, 
              time-consuming tasks—so owners and teams can focus on what they do best: delivering 
              exceptional service to their customers.
            </p>
          </div>
        </section>

        {/* Origin Story */}
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 text-primary mb-4">
                  <MapPin className="h-5 w-5" />
                  <span className="font-semibold">Born in Texas</span>
                </div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Aura Intercept was born in Austin, Texas—a city known for its entrepreneurial spirit 
                    and innovative tech scene. We saw firsthand how local service businesses struggled 
                    with the same challenges: missed calls, scheduling headaches, and endless administrative tasks.
                  </p>
                  <p>
                    While large corporations had access to sophisticated AI solutions, small and medium 
                    businesses were left behind. We set out to change that.
                  </p>
                  <p>
                    Today, our AI operatives serve businesses across Texas and beyond—from HVAC companies 
                    and plumbers to salons and restaurants. Each business gets the same powerful automation 
                    that was once reserved for Fortune 500 companies.
                  </p>
                </div>
              </div>
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
                <CardContent className="p-8">
                  <Zap className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Smart Agents, Automated Service</h3>
                  <p className="text-muted-foreground mb-6">
                    Our tagline captures our promise: intelligent AI agents that automate your service 
                    operations, freeing you to grow your business.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>24 specialized AI operatives</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>7 purpose-built consoles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>6 flexible subscription tiers</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 bg-card">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground">
                The principles that guide everything we do
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((value) => (
                <Card key={value.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of Texas businesses already using Aura Intercept to automate their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth?mode=company')}>
                Start 90-Day Live Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
                Contact Us
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              First 30 days = onboarding · then 60 days of full live use
            </p>
          </div>
        </section>
      </main>
      
      <PublicFooter />
    </div>
  );
}
