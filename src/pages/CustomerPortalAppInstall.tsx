import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  ExternalLink, 
  Building2, 
  Calendar, 
  Bell, 
  FileText,
  QrCode,
  Download,
  CheckCircle2,
  ArrowRight,
  Users,
  Truck,
  Briefcase,
  Megaphone,
  BarChart3,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const controlCenters = [
  {
    name: 'Customer Portal Console',
    description: 'AI-powered customer interactions with booking, quotes, and support.',
    icon: Users,
    gradient: 'from-cyan-500 to-blue-500',
    features: ['Online booking', 'Quote requests', 'Appointment tracking', 'AI chat support']
  },
  {
    name: 'Field Operations Console',
    description: 'Dispatch, routing, and real-time technician management.',
    icon: Truck,
    gradient: 'from-green-500 to-emerald-500',
    features: ['Smart dispatch', 'Route optimization', 'Live ETA tracking', 'Technician check-in']
  },
  {
    name: 'Business Management Console',
    description: 'Invoicing, inventory, and warranty operations.',
    icon: Briefcase,
    gradient: 'from-orange-500 to-amber-500',
    features: ['Invoice generation', 'Inventory tracking', 'Warranty management', 'Quote builder']
  },
  {
    name: 'Marketing & Sales Console',
    description: 'Lead management and campaign automation.',
    icon: Megaphone,
    gradient: 'from-purple-500 to-pink-500',
    features: ['Lead capture', 'Campaign automation', 'Customer segments', 'Follow-up sequences']
  },
  {
    name: 'Analytics & Reports Console',
    description: 'KPIs, insights, and performance dashboards.',
    icon: BarChart3,
    gradient: 'from-indigo-500 to-violet-500',
    features: ['KPI dashboard', 'Revenue analysis', 'Trend forecasting', 'Performance reports']
  },
  {
    name: 'Smart Website Console',
    description: 'Branded 1-page website with AI chat and voice.',
    icon: Globe,
    gradient: 'from-pink-500 to-rose-500',
    features: ['AI Chat & Voice', 'Content editor', 'Visitor analytics', 'Domain management']
  }
];

export default function CustomerPortalAppInstall() {
  const installUrl = `${window.location.origin}/customer-portal-install`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(installUrl);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Portal App Install</h1>
          <p className="text-white/70 mt-1">
            Mobile app installation page for your customers
          </p>
        </div>

        {/* Customer Portal PWA Info Card */}
        <Card className="border-border/50 bg-gradient-to-r from-cyan-500/10 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              Customer Portal PWA
            </CardTitle>
            <CardDescription className="text-white/70">
              Standalone Progressive Web App with install info, sign-in, and full AI Console access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-white">How It Works</h4>
                <ul className="space-y-3 text-sm text-white/70">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs shrink-0 font-semibold">1</span>
                    <span>Customers sign up through company's embedded widget</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs shrink-0 font-semibold">2</span>
                    <span>After signup, they're prompted to install the Customer Portal App</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs shrink-0 font-semibold">3</span>
                    <span>Gives customers access to the Customer Portal Mobile App</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-white">Customer Benefits</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Customer Portal Mobile App Access', icon: Building2 },
                    { label: 'Track appointments', icon: Calendar },
                    { label: 'View quotes & invoices', icon: FileText },
                    { label: 'Get notifications', icon: Bell }
                  ].map((feature) => (
                    <div key={feature.label} className="flex items-center gap-2 text-xs text-white/70 bg-slate-700/50 rounded-lg px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {feature.label}
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => window.open(installUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Customer Portal PWA
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code & Install Link Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* QR Code Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                Installation QR Code
              </CardTitle>
              <CardDescription className="text-white/70">
                Customers can scan this code to install the app
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <QRCodeSVG 
                  value={installUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Scan with any smartphone camera to open the install page
              </p>
            </CardContent>
          </Card>

          {/* Install URL Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-secondary" />
                Direct Install Link
              </CardTitle>
              <CardDescription className="text-white/70">
                Share this link with customers to install the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700/50 rounded-lg px-4 py-3 border border-slate-600/50">
                  <code className="text-sm text-cyan-400 break-all">{installUrl}</code>
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3 pt-4">
                <h4 className="font-medium text-sm text-white">How to Share</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Include in confirmation emails
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Add to SMS reminders
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Display QR code in your office
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Add to your website
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full gap-2 mt-4"
                onClick={() => window.open(installUrl, '_blank')}
              >
                Preview Install Page
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Customer Journey */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Customer Installation Journey</CardTitle>
            <CardDescription className="text-white/70">
              The path customers take to install and use the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {[
                { step: 1, title: 'Sign Up', desc: 'Via embedded widget' },
                { step: 2, title: 'See QR Code', desc: 'Post-signup prompt' },
                { step: 3, title: 'Scan & Install', desc: 'Add to home screen' },
                { step: 4, title: 'Mobile App', desc: 'for Customer Portal' },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-lg mb-2">
                      {item.step}
                    </div>
                    <h4 className="font-medium text-sm text-white">{item.title}</h4>
                    <p className="text-xs text-white/60">{item.desc}</p>
                  </div>
                  {idx < 3 && (
                    <ArrowRight className="w-5 h-5 text-white/30 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 6 Control Centers Section */}
        <Card className="border-border/50">
          <CardHeader className="text-center">
            <Badge variant="secondary" className="mb-2 w-fit mx-auto">Aura Agent Consoles</Badge>
            <CardTitle className="text-2xl">6 Powerful Intercept Control Centers</CardTitle>
            <CardDescription className="text-white/70">
              Purpose-built consoles give your team full control over AI agent operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {controlCenters.map((console) => (
                <div 
                  key={console.name}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-slate-800/50 p-4 hover:border-primary/50 transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${console.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${console.gradient} flex items-center justify-center mb-3`}>
                      <console.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-sm text-white mb-1">{console.name}</h4>
                    <p className="text-xs text-white/60 mb-3">{console.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {console.features.map((feature) => (
                        <span 
                          key={feature}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-white/70"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
