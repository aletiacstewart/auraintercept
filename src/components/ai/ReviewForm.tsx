import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Send, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  onSubmit: (review: {
    rating: number;
    comment: string;
    customerName: string;
    customerPhone: string;
    selectedPlatforms: string[];
  }) => void;
  isLoading?: boolean;
  reviewLinks?: { platform: string; url: string }[];
}

export const ReviewForm = ({ onSubmit, isLoading, reviewLinks = [] }: ReviewFormProps) => {
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
    <Card className="w-full max-w-md mx-auto border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Leave a Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasNoPlatformsConfigured ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              No review platforms configured. Please contact the business to set up review links.
            </p>
          </div>
        ) : (
          <>
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
              <label className="text-sm font-medium text-muted-foreground">Phone Number (optional)</label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter your phone number"
                type="tel"
                maxLength={20}
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Select where to leave your review *</label>
              <div className="space-y-2">
                {availablePlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      selectedPlatforms.includes(platform.id)
                        ? `${platform.bgColor} border-2`
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    <span className="text-lg">{platform.icon}</span>
                    <span className={cn("font-medium", platform.color)}>{platform.label}</span>
                    <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                ))}
              </div>
              {selectedPlatforms.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedPlatforms.length === 1 
                    ? 'Selected platform will open when you submit'
                    : `${selectedPlatforms.length} platforms will open when you submit`
                  }
                </p>
              )}
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">How would you rate us?</label>
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
                  {rating === 5 ? 'Excellent! Thank you!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'We appreciate your feedback'}
                </p>
              )}
            </div>

            {/* Optional Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                What did you enjoy most? (optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about your experience..."
                className="resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!customerName.trim() || selectedPlatforms.length === 0 || isLoading}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit & Open Review {selectedPlatforms.length > 1 ? 'Pages' : 'Page'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your review helps other customers find us. Thank you!
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
