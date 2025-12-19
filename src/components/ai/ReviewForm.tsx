import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  onSubmit: (review: {
    rating: number;
    comment: string;
    customerName: string;
    customerPhone: string;
    selectedPlatforms: string[];
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  reviewLinks?: { platform: string; url: string }[];
}

export const ReviewForm = ({ onSubmit, onCancel, isLoading, reviewLinks = [] }: ReviewFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const platformOptions = [
    { id: 'google', label: 'Google', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: '🔵' },
    { id: 'facebook', label: 'Facebook', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200', icon: '📘' },
    { id: 'yelp', label: 'Yelp', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: '⭐' },
  ];

  // Filter to only show platforms that have configured URLs
  const availablePlatforms = platformOptions.filter(platform => {
    const link = reviewLinks.find(l => l.platform.toLowerCase() === platform.id);
    return link && link.url;
  });

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = () => {
    if (!customerName.trim() || selectedPlatforms.length === 0) return;
    
    onSubmit({
      rating: rating || 5,
      comment: comment.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      selectedPlatforms
    });

    // Open review links for selected platforms
    selectedPlatforms.forEach(platformId => {
      const link = reviewLinks.find(l => l.platform.toLowerCase() === platformId);
      if (link?.url) {
        window.open(link.url, '_blank');
      }
    });
  };

  const hasNoPlatformsConfigured = availablePlatforms.length === 0;

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
        <h3 className="font-semibold text-sm">Leave a Review</h3>
      </div>
      
      {hasNoPlatformsConfigured ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          No review platforms configured.
        </p>
      ) : (
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
            placeholder="Phone Number (optional)"
            type="tel"
            className="h-8 text-xs"
            maxLength={20}
          />

          {/* Platform Selection */}
          <div>
            <label className="text-xs text-muted-foreground">Select where to review *</label>
            <div className="space-y-1 mt-1">
              {availablePlatforms.map((platform) => (
                <div
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded border cursor-pointer text-xs",
                    selectedPlatforms.includes(platform.id)
                      ? `${platform.bgColor}`
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                  />
                  <span>{platform.icon}</span>
                  <span className={platform.color}>{platform.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Star Rating */}
          <div>
            <label className="text-xs text-muted-foreground">How would you rate us?</label>
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

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you enjoy most? (optional)"
            className="resize-none text-xs"
            rows={2}
            maxLength={500}
          />

          <Button
            onClick={handleSubmit}
            disabled={!customerName.trim() || selectedPlatforms.length === 0 || isLoading}
            className="w-full h-8 text-xs"
          >
            <Send className="h-3 w-3 mr-1" />
            Submit & Open Review
          </Button>
        </div>
      )}
    </div>
  );
};
