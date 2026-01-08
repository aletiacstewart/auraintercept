import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Star, ThumbsUp, Minus, ThumbsDown, Send, ExternalLink, CalendarIcon, ArrowLeft, CheckCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface FeedbackData {
  rating: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  note: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceDate?: Date;
  requestContact?: boolean;
}

interface EnhancedFeedbackFormProps {
  onSubmit: (feedback: FeedbackData) => void;
  onCancel?: () => void;
  onReviewHandoff?: () => void;
  isLoading?: boolean;
  reviewLinks?: { platform: string; url: string }[];
  companyName?: string;
}

export const EnhancedFeedbackForm = ({ 
  onSubmit, 
  onCancel, 
  onReviewHandoff,
  isLoading, 
  reviewLinks,
  companyName 
}: EnhancedFeedbackFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceDate, setServiceDate] = useState<Date | undefined>(undefined);
  const [requestContact, setRequestContact] = useState(false);
  
  // Thank you dialog states
  const [showThankYouDialog, setShowThankYouDialog] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isPositiveFeedback = sentiment === 'positive' || rating >= 4;
  const isNegativeFeedback = sentiment === 'negative' || (rating > 0 && rating <= 3);
  const showContactOption = sentiment === 'neutral' || sentiment === 'negative' || (rating > 0 && rating <= 3);

  const handleSubmit = () => {
    if (!sentiment || !customerName.trim()) return;
    
    const feedbackData: FeedbackData = {
      rating: rating || (sentiment === 'positive' ? 5 : sentiment === 'neutral' ? 3 : 1),
      sentiment,
      note: note.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      serviceDate,
      requestContact: showContactOption ? requestContact : undefined,
    };

    onSubmit(feedbackData);
    setSubmitted(true);

    // Show appropriate thank you dialog
    if (isPositiveFeedback) {
      setShowReviewPrompt(true);
    } else {
      setShowThankYouDialog(true);
    }
  };

  const handleReviewClick = (url: string) => {
    window.open(url, '_blank');
    onReviewHandoff?.();
  };

  const sentimentOptions = [
    { 
      value: 'positive' as const, 
      label: 'Great!', 
      icon: ThumbsUp, 
      color: 'text-green-500 hover:bg-green-50 border-green-200', 
      activeColor: 'bg-green-100 border-green-500 text-green-700' 
    },
    { 
      value: 'neutral' as const, 
      label: 'Okay', 
      icon: Minus, 
      color: 'text-yellow-500 hover:bg-yellow-50 border-yellow-200', 
      activeColor: 'bg-yellow-100 border-yellow-500 text-yellow-700' 
    },
    { 
      value: 'negative' as const, 
      label: 'Could be better', 
      icon: ThumbsDown, 
      color: 'text-red-500 hover:bg-red-50 border-red-200', 
      activeColor: 'bg-red-100 border-red-500 text-red-700' 
    },
  ];

  // If already submitted, show only dialogs
  if (submitted) {
    return (
      <>
        {/* Positive Feedback - Review Prompt Dialog */}
        <Dialog open={showReviewPrompt} onOpenChange={setShowReviewPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Thank You for Your Feedback!
              </DialogTitle>
              <DialogDescription>
                We're thrilled to hear about your positive experience with {companyName || 'us'}!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Would you mind sharing your experience on one of these platforms? 
                Your review helps others find quality service!
              </p>
              <div className="flex flex-wrap gap-2">
                {reviewLinks && reviewLinks.map((link) => (
                  <Button
                    key={link.platform}
                    variant="outline"
                    onClick={() => handleReviewClick(link.url)}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Review on {link.platform}
                  </Button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4"
                onClick={() => setShowReviewPrompt(false)}
              >
                Maybe Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Negative/Neutral Feedback - Contact Request Dialog */}
        <Dialog open={showThankYouDialog} onOpenChange={setShowThankYouDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Thank You for Your Feedback
              </DialogTitle>
              <DialogDescription>
                {requestContact 
                  ? "A representative will be contacting you regarding your important feedback."
                  : "We appreciate you taking the time to share your experience with us."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                {requestContact 
                  ? "We take all feedback seriously and want to ensure your concerns are addressed. Expect a call or email from our team soon."
                  : "Your feedback helps us improve our services. Thank you for being a valued customer."}
              </p>
              <Button 
                className="w-full mt-4"
                onClick={() => setShowThankYouDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto p-2">
      <div className="flex items-center gap-2 mb-3">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 w-7 p-0 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Star className="h-4 w-4 text-yellow-500" />
        <h3 className="font-semibold text-sm">Share Your Feedback</h3>
      </div>
      
      <div className="space-y-2">
        <Input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Your Name *"
          className="h-8 text-xs"
          maxLength={100}
        />

        <Input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="Phone Number"
          type="tel"
          className="h-8 text-xs"
          maxLength={20}
        />

        <Input
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="Email (optional)"
          type="email"
          className="h-8 text-xs"
          maxLength={100}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start text-left font-normal h-8 text-xs",
                !serviceDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" />
              {serviceDate ? format(serviceDate, "MMM d, yyyy") : "Date of Service (optional)"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={serviceDate}
              onSelect={setServiceDate}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Star Rating */}
        <div>
          <label className="text-xs text-muted-foreground">Rate your experience</label>
          <div className="flex gap-0.5 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setRating(star);
                  // Auto-set sentiment based on rating
                  if (star >= 4) setSentiment('positive');
                  else if (star === 3) setSentiment('neutral');
                  else setSentiment('negative');
                }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    (hoveredRating || rating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Sentiment Buttons */}
        <div>
          <label className="text-xs text-muted-foreground">How was your experience?</label>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {sentimentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSentiment(option.value);
                  // Auto-set rating based on sentiment if not already set
                  if (rating === 0) {
                    if (option.value === 'positive') setRating(5);
                    else if (option.value === 'neutral') setRating(3);
                    else setRating(2);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-1.5 rounded border text-xs transition-all",
                  sentiment === option.value
                    ? option.activeColor
                    : `border-muted ${option.color}`
                )}
              >
                <option.icon className="h-4 w-4" />
                <span className="text-[10px]">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional comments (optional)"
          className="resize-none text-xs"
          rows={2}
          maxLength={500}
        />

        {/* Contact Request Checkbox - Only shows for neutral/negative feedback */}
        {showContactOption && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border">
            <Checkbox
              id="requestContact"
              checked={requestContact}
              onCheckedChange={(checked) => setRequestContact(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="requestContact" className="text-xs text-muted-foreground cursor-pointer">
              I would like to be contacted by {companyName || 'the company'} to resolve any issues
            </label>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!sentiment || !customerName.trim() || isLoading}
          className="w-full h-8 text-xs"
        >
          <Send className="h-3 w-3 mr-1" />
          Submit Feedback
        </Button>
      </div>
    </div>
  );
};
