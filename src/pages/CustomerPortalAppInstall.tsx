import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  Users
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { QRCodeSVG } from 'qrcode.react';

export default function CustomerPortalAppInstall() {
  const installUrl = `${window.location.origin}/customer-portal-install`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(installUrl);
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            icon={Users}
            title="Customer Portal App Install"
            description="Mobile app installation page for your customers"
            featureColor="customers"
          />

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
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
