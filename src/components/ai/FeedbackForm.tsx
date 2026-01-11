import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Star, ThumbsUp, Minus, ThumbsDown, Send, ExternalLink, CalendarIcon, ArrowLeft } from 'lucide-react';
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
  onCancel?: () => void;
  isLoading?: boolean;
  reviewLinks?: { platform: string; url: string }[];
}

export const FeedbackForm = ({ onSubmit, onCancel, isLoading, reviewLinks }: FeedbackFormProps) => {
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
          <label className="text-xs text-slate-600">Rate your experience</label>
          <div className="flex gap-0.5 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
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
          <label className="text-xs text-slate-600">How was your experience?</label>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {sentimentOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSentiment(option.value)}
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

        <Button
          onClick={handleSubmit}
          disabled={!sentiment || !customerName.trim() || isLoading}
          className="w-full h-8 text-xs"
        >
          <Send className="h-3 w-3 mr-1" />
          Submit Feedback
        </Button>

        {reviewLinks && reviewLinks.length > 0 && sentiment === 'positive' && (
          <div className="pt-1 border-t">
            <p className="text-[10px] text-slate-500 mb-1">Love our service? Share it!</p>
            <div className="flex flex-wrap gap-1">
              {reviewLinks.map((link) => (
                <Button
                  key={link.platform}
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(link.url, '_blank')}
                  className="h-6 text-[10px] px-2"
                >
                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                  {link.platform}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};