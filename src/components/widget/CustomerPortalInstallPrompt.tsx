import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Smartphone, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerPortalInstallPromptProps {
  onContinue: () => void;
  userEmail?: string;
  primaryColor?: string;
}

export function CustomerPortalInstallPrompt({ 
  onContinue, 
  userEmail,
  primaryColor = '#6366f1'
}: CustomerPortalInstallPromptProps) {
  // Get the base URL for the install page
  const getInstallUrl = () => {
    // Use the current origin, which will work in both preview and production
    const baseUrl = window.location.origin;
    return `${baseUrl}/customer-portal-install`;
  };

  const installUrl = getInstallUrl();

  return (
    <div className="mx-4 mb-4 p-4 rounded-lg border bg-card relative">
      <button
        onClick={onContinue}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
        aria-label="Skip"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Success header */}
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="h-8 w-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <CheckCircle2 className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Account Created!</h4>
          {userEmail && (
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          )}
        </div>
      </div>

      {/* Install prompt */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Smartphone className="h-4 w-4 text-primary" />
          <span>Install the Customer Portal App</span>
        </div>
        
        <p className="text-xs text-muted-foreground px-2">
          Access all your service providers in one place. Scan this QR code with your phone to install.
        </p>

        {/* QR Code */}
        <div className="flex justify-center py-3">
          <div className="p-3 bg-white rounded-lg shadow-sm border">
            <QRCodeSVG 
              value={installUrl}
              size={120}
              level="M"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Or open on your phone:
        </p>
        <a 
          href={installUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          customer-portal-install
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Features preview */}
        <div className="pt-3 border-t mt-3">
          <p className="text-[10px] text-muted-foreground mb-2">With the app you can:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Track appointments', 'Get notifications', 'Access all companies'].map((feature) => (
              <span 
                key={feature}
                className="text-[10px] px-2 py-1 rounded-full bg-muted"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Continue button */}
      <Button 
        variant="ghost" 
        className="w-full mt-4 text-xs"
        onClick={onContinue}
      >
        Continue without installing
      </Button>
    </div>
  );
}
