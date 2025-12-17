import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2, Phone, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SMSChatProps {
  companyId: string;
  companyName: string;
}

interface SentMessage {
  to: string;
  message: string;
  sentAt: Date;
  status: 'sent' | 'failed';
}

// Common SMS templates
const SMS_TEMPLATES = [
  { id: 'appointment', label: 'Appointment Confirmation', message: "Hi! Your appointment with {company} is confirmed for {date}. Reply HELP for assistance." },
  { id: 'reminder', label: 'Appointment Reminder', message: "Reminder: You have an upcoming appointment with {company}. Reply C to confirm or R to reschedule." },
  { id: 'followup', label: 'Service Follow-up', message: "Thank you for choosing {company}! How was your recent service? Reply with 1-5 stars." },
  { id: 'custom', label: 'Custom Message', message: "" },
];

export const SMSChat: React.FC<SMSChatProps> = ({ companyId, companyName }) => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [isSending, setIsSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = SMS_TEMPLATES.find(t => t.id === templateId);
    if (template && template.message) {
      setMessage(template.message.replace('{company}', companyName));
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Add +1 if US number without country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return phone.startsWith('+') ? phone : `+${digits}`;
  };

  const handleSendSMS = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both phone number and message",
      });
      return;
    }

    setIsSending(true);
    const formattedPhone = formatPhoneNumber(phoneNumber);

    try {
      const { data, error } = await supabase.functions.invoke('send-appointment-sms', {
        body: {
          companyId,
          toPhone: formattedPhone,
          message: message,
          type: 'custom'
        }
      });

      if (error) throw error;

      setSentMessages(prev => [{
        to: formattedPhone,
        message,
        sentAt: new Date(),
        status: 'sent'
      }, ...prev]);

      toast({
        title: "SMS Sent",
        description: `Message sent to ${formattedPhone}`,
      });

      // Clear form
      setMessage('');
      setSelectedTemplate('custom');
    } catch (error) {
      console.error('SMS send error:', error);
      setSentMessages(prev => [{
        to: formattedPhone,
        message,
        sentAt: new Date(),
        status: 'failed'
      }, ...prev]);

      toast({
        variant: "destructive",
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send SMS",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center py-4 border-b">
        <div className="h-12 w-12 rounded-full bg-primary/10 mx-auto mb-2 flex items-center justify-center">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold">SMS Messaging</h3>
        <p className="text-sm text-muted-foreground">Send SMS via Twilio</p>
      </div>

      {/* Send Form */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Phone Number Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="pl-10"
            />
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Message Template</label>
          <div className="grid grid-cols-2 gap-2">
            {SMS_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate === template.id ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-auto py-2 px-3"
                onClick={() => handleTemplateChange(template.id)}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length} / 160 characters
          </p>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendSMS}
          disabled={isSending || !phoneNumber.trim() || !message.trim()}
          className="w-full"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send SMS
        </Button>

        {/* Sent Messages History */}
        {sentMessages.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium">Recent Messages</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sentMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    msg.status === 'sent' ? 'bg-primary/10' : 'bg-destructive/10'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium flex items-center gap-1">
                      {msg.status === 'sent' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : null}
                      {msg.to}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.sentAt.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
