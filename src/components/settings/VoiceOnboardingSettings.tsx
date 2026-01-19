import { 
  Mic, 
  MicOff, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Check, 
  LogOut,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Chrome,
  Sparkles,
  Volume2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';

export function VoiceOnboardingSettings() {
  const { isVoiceModeEnabled, isSupported, toggleVoiceMode, isListening } = useVoice();

  const voiceCommands = [
    { command: '"Next" or "Tab"', action: 'Move to next input field', icon: ArrowRight, color: 'text-blue-500' },
    { command: '"Back" or "Previous"', action: 'Move to previous field', icon: ArrowLeft, color: 'text-purple-500' },
    { command: '"Clear" or "Erase"', action: 'Clear current field', icon: Trash2, color: 'text-orange-500' },
    { command: '"Save Job" or "Submit"', action: 'Submit the current form', icon: Check, color: 'text-green-500' },
    { command: '"Clock Out" or "Logout"', action: 'End your session', icon: LogOut, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-aura-emerald/30 bg-gradient-to-br from-aura-emerald/5 to-aura-teal/5">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
              isVoiceModeEnabled 
                ? "bg-aura-emerald/20 ring-2 ring-aura-emerald/30" 
                : "bg-sidebar-accent"
            )}>
              <Mic className={cn(
                "w-7 h-7",
                isVoiceModeEnabled ? "text-aura-emerald" : "text-muted-foreground",
                isListening && "animate-pulse"
              )} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">Aura Voice</CardTitle>
                <Badge className="bg-aura-emerald/20 text-aura-emerald border-aura-emerald/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Hands-Free Mode
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Control the platform with your voice. Fill forms, navigate, and execute commands without touching your keyboard.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Enable */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isVoiceModeEnabled ? "bg-aura-emerald/20" : "bg-muted"
              )}>
                {isVoiceModeEnabled ? (
                  <Volume2 className="w-5 h-5 text-aura-emerald" />
                ) : (
                  <MicOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{isVoiceModeEnabled ? "Voice Mode Active" : "Voice Mode Disabled"}</p>
                <p className="text-sm text-muted-foreground">
                  {isVoiceModeEnabled ? "Speak to fill forms and navigate" : "Enable to start using voice commands"}
                </p>
              </div>
            </div>
            <Switch
              checked={isVoiceModeEnabled}
              onCheckedChange={toggleVoiceMode}
              disabled={!isSupported}
              className="data-[state=checked]:bg-aura-emerald"
            />
          </div>

          {/* Browser Support Warning */}
          {!isSupported && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Browser Not Supported</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Aura Voice requires the Web Speech API. Please use Chrome, Edge, or Safari for voice features.
                </p>
              </div>
            </div>
          )}

          {/* Keyboard Shortcut */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Keyboard className="w-4 h-4" />
            <span>Quick toggle: </span>
            <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">Shift</kbd>
            <span>+</span>
            <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">V</kbd>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-aura-emerald" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>Get started with Aura Voice in 4 simple steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {[
              { step: 1, title: "Enable Voice Mode", desc: "Toggle the switch above or use Ctrl+Shift+V" },
              { step: 2, title: "Allow Microphone", desc: "Grant microphone permission when your browser prompts" },
              { step: 3, title: "Click Into a Field", desc: "Click any text input - it will glow green when listening" },
              { step: 4, title: "Start Speaking", desc: "Speak naturally and watch your words appear in real-time" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-aura-emerald/20 text-aura-emerald flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Commands Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-aura-emerald" />
            Voice Commands
          </CardTitle>
          <CardDescription>Say these commands to navigate and control the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {voiceCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <div 
                  key={cmd.command}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border hover:bg-muted/80 transition-colors"
                >
                  <div className={cn("w-10 h-10 rounded-lg bg-background flex items-center justify-center", cmd.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">{cmd.command}</p>
                    <p className={cn("text-sm", cmd.color)}>{cmd.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tips & Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Tips & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              "Speak clearly at a natural pace - no need to speak slowly",
              "Pause briefly between dictation and commands for better recognition",
              "Commands must be spoken at the end of your phrase to trigger",
              "Works best in quiet environments with minimal background noise",
              "Mix dictation with commands: \"123 Main Street next\" fills the field then moves to the next",
              "The green pulse animation shows which field is currently listening",
            ].map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-aura-emerald mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Microphone not working?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check that your browser has microphone permissions. Click the lock icon in your browser's address bar and ensure microphone access is allowed.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium">Commands not recognized?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Speak slightly slower and ensure you're using the exact command phrases. Check the commands reference above for the correct wording.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium">Voice Mode toggle not appearing?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aura Voice requires a browser that supports the Web Speech API. Please use Chrome, Edge, or Safari. Firefox is not supported.
            </p>
          </div>
          <Separator />
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Chrome className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Best experience: <strong className="text-foreground">Google Chrome</strong> or <strong className="text-foreground">Microsoft Edge</strong>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
