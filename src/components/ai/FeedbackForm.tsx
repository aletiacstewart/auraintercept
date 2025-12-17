import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Star, ThumbsUp, Minus, ThumbsDown, Send, ExternalLink, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FeedbackFormProps {
  onSubmit: (feedback: {
    rating: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    note: string;
    customerName: string;
    customerPhone: string;
    serviceDate?: Date;
  }) => void;
  isLoading?: boolean;
  reviewLinks?: { platform: string; url: string }[];
}

export const FeedbackForm = ({ onSubmit, isLoading, reviewLinks }: FeedbackFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceDate, setServiceDate] = useState<Date | undefined>(undefined);

  const handleSubmit = () => {
    if (!sentiment || !customerName.trim()) return;
    
    onSubmit({
      rating: rating || (sentiment === 'positive' ? 5 : sentiment === 'neutral' ? 3 : 1),
      sentiment,
      note: note.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceDate
    });
  };

  const sentimentOptions = [
    { value: 'positive' as const, label: 'Great!', icon: ThumbsUp, color: 'text-green-500 hover:bg-green-50 border-green-200', activeColor: 'bg-green-100 border-green-500 text-green-700' },
    { value: 'neutral' as const, label: 'Okay', icon: Minus, color: 'text-yellow-500 hover:bg-yellow-50 border-yellow-200', activeColor: 'bg-yellow-100 border-yellow-500 text-yellow-700' },
    { value: 'negative' as const, label: 'Could be better', icon: ThumbsDown, color: 'text-red-500 hover:bg-red-50 border-red-200', activeColor: 'bg-red-100 border-red-500 text-red-700' },
  ];

  return (
    <Card className="w-full max-w-md mx-auto border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Share Your Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Your Name *</label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={100}
          />
        </div>

        {/* Customer Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Enter your phone number"
            type="tel"
            maxLength={20}
          />
        </div>

        {/* Date of Service */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Date of Service (optional)</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !serviceDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {serviceDate ? format(serviceDate, "PPP") : <span>Select date to link to appointment</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={serviceDate}
                onSelect={setServiceDate}
                disabled={(date) => date > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">Helps us connect your feedback to your appointment</p>
        </div>

        {/* Star Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Rate your experience</label>
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    (hoveredRating || rating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Needs improvement'}
            </p>
          )}
        </div>

        {/* Sentiment Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">How was your experience?</label>
          <div className="grid grid-cols-3 gap-2">
            {sentimentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSentiment(option.value)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                  sentiment === option.value
                    ? option.activeColor
                    : `border-muted ${option.color}`
                )}
              >
                <option.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Additional comments (optional)
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell us more about your experience..."
            className="resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{note.length}/500</p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!sentiment || !customerName.trim() || isLoading}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          Submit Feedback
        </Button>

        {/* Review Links */}
        {reviewLinks && reviewLinks.length > 0 && sentiment === 'positive' && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Love our service? Share it with others!
            </p>
            <div className="flex flex-wrap gap-2">
              {reviewLinks.map((link) => (
                <Button
                  key={link.platform}
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(link.url, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {link.platform}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};