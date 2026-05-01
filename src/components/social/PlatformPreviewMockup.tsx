import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Video, 
  MapPin, 
  MessageSquare,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  ThumbsUp,
  Share2,
  MoreHorizontal,
} from 'lucide-react';

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google_business' | 'sms';

interface PlatformPreviewMockupProps {
  platform: Platform;
  content: string;
  hashtags: string[];
  imageUrl?: string;
  companyName?: string;
}

export const PlatformPreviewMockup: React.FC<PlatformPreviewMockupProps> = ({
  platform,
  content,
  hashtags,
  imageUrl,
  companyName = 'Your Business',
}) => {
  const hashtagString = hashtags.length > 0 
    ? '\n\n' + hashtags.map(h => `#${h}`).join(' ')
    : '';
  const fullContent = content + hashtagString;

  // Instagram Preview
  if (platform === 'instagram') {
    return (
      <Card className="overflow-hidden bg-white text-black max-w-[320px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs">
              {companyName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{companyName.toLowerCase().replace(/\s/g, '_')}</p>
          </div>
          <MoreHorizontal className="h-5 w-5" />
        </div>
        
        {/* Image */}
        {imageUrl ? (
          <div className="aspect-square bg-gray-100">
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <Instagram className="h-16 w-16 text-pink-300" />
          </div>
        )}
        
        {/* Actions */}
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6" />
        </div>
        
        {/* Caption */}
        <div className="px-3 pb-3">
          <p className="text-sm">
            <span className="font-semibold mr-1">{companyName.toLowerCase().replace(/\s/g, '_')}</span>
            <span className="whitespace-pre-wrap break-words">
              {fullContent.length > 100 ? fullContent.slice(0, 100) + '...' : fullContent}
            </span>
          </p>
        </div>
      </Card>
    );
  }

  // Facebook Preview
  if (platform === 'facebook') {
    return (
      <Card className="overflow-hidden bg-white text-black max-w-[320px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-600 text-white text-xs">
              {companyName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{companyName}</p>
            <p className="text-xs text-gray-500">Just now · 🌐</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </div>
        
        {/* Content */}
        <div className="px-3 pb-2">
          <p className="text-sm whitespace-pre-wrap break-words">
            {fullContent.length > 150 ? fullContent.slice(0, 150) + '...' : fullContent}
          </p>
        </div>
        
        {/* Image */}
        {imageUrl ? (
          <div className="aspect-video bg-gray-100">
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <Facebook className="h-12 w-12 text-cyan-300" />
          </div>
        )}
        
        {/* Actions */}
        <div className="p-3 flex items-center justify-around border-t">
          <div className="flex items-center gap-1.5 text-gray-600">
            <ThumbsUp className="h-5 w-5" />
            <span className="text-sm">Like</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">Comment</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Share2 className="h-5 w-5" />
            <span className="text-sm">Share</span>
          </div>
        </div>
      </Card>
    );
  }

  // LinkedIn Preview
  if (platform === 'linkedin') {
    return (
      <Card className="overflow-hidden bg-white text-black max-w-[320px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 p-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-sky-700 text-white text-xs">
              {companyName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{companyName}</p>
            <p className="text-xs text-gray-500">1,234 followers</p>
            <p className="text-xs text-gray-500">Just now · 🌐</p>
          </div>
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </div>
        
        {/* Content */}
        <div className="px-3 pb-2">
          <p className="text-sm whitespace-pre-wrap break-words">
            {fullContent.length > 200 ? fullContent.slice(0, 200) + '...' : fullContent}
          </p>
        </div>
        
        {/* Image */}
        {imageUrl ? (
          <div className="aspect-video bg-gray-100">
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
            <Linkedin className="h-12 w-12 text-cyan-300" />
          </div>
        )}
        
        {/* Actions */}
        <div className="p-3 flex items-center justify-around border-t text-gray-600">
          <div className="flex items-center gap-1 text-xs">
            <ThumbsUp className="h-4 w-4" />
            Like
          </div>
          <div className="flex items-center gap-1 text-xs">
            <MessageCircle className="h-4 w-4" />
            Comment
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Share2 className="h-4 w-4" />
            Repost
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Send className="h-4 w-4" />
            Send
          </div>
        </div>
      </Card>
    );
  }

  // TikTok Preview
  if (platform === 'tiktok') {
    return (
      <Card className="overflow-hidden bg-black text-white max-w-[200px] mx-auto">
        {/* Video Area */}
        <div className="relative aspect-[9/16] bg-gradient-to-b from-fuchsia-900/50 to-black">
          {imageUrl ? (
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-12 w-12 text-fuchsia-400" />
            </div>
          )}
          
          {/* Side Actions */}
          <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarFallback className="bg-fuchsia-600 text-white text-xs">
                {companyName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center">
              <Heart className="h-7 w-7" />
              <span className="text-xs">1.2K</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="h-7 w-7" />
              <span className="text-xs">89</span>
            </div>
            <div className="flex flex-col items-center">
              <Bookmark className="h-7 w-7" />
              <span className="text-xs">45</span>
            </div>
            <div className="flex flex-col items-center">
              <Share2 className="h-7 w-7" />
              <span className="text-xs">12</span>
            </div>
          </div>
          
          {/* Bottom Info */}
          <div className="absolute bottom-4 left-2 right-14">
            <p className="text-sm font-semibold">@{companyName.toLowerCase().replace(/\s/g, '')}</p>
            <p className="text-xs mt-1 line-clamp-2">{content.slice(0, 80)}</p>
            {hashtags.length > 0 && (
              <p className="text-xs text-fuchsia-300 mt-1">
                {hashtags.slice(0, 3).map(h => `#${h}`).join(' ')}
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Google Business Preview
  if (platform === 'google_business') {
    return (
      <Card className="overflow-hidden bg-white text-black max-w-[320px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 bg-gray-50">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-teal-600 text-white text-xs">
              {companyName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm font-semibold">{companyName}</p>
            <p className="text-xs text-gray-500">Posted just now</p>
          </div>
          <MapPin className="h-5 w-5 text-teal-600" />
        </div>
        
        {/* Image */}
        {imageUrl ? (
          <div className="aspect-video bg-gray-100">
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-teal-300" />
          </div>
        )}
        
        {/* Content */}
        <div className="p-3">
          <p className="text-sm whitespace-pre-wrap break-words">
            {content.length > 150 ? content.slice(0, 150) + '...' : content}
          </p>
        </div>
        
        {/* CTA */}
        <div className="px-3 pb-3">
          <div className="py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded text-center">
            Learn More
          </div>
        </div>
      </Card>
    );
  }

  // SMS Preview
  if (platform === 'sms') {
    return (
      <Card className="overflow-hidden bg-gray-100 max-w-[280px] mx-auto p-4">
        <div className="text-center mb-3">
          <p className="text-xs text-gray-500">SMS Preview</p>
        </div>
        
        {/* Message Bubble */}
        <div className="bg-blue-500 text-white rounded-2xl rounded-bl-md p-3 max-w-[220px] ml-auto shadow-sm">
          <p className="text-sm whitespace-pre-wrap break-words">
            {content.length > 160 ? content.slice(0, 157) + '...' : content}
          </p>
        </div>
        
        {/* Character Count */}
        <div className="text-right mt-2">
          <span className={`text-xs ${content.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
            {content.length}/160
          </span>
        </div>
        
        {/* Info */}
        <div className="flex items-center gap-2 mt-3 text-gray-500">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">Standard SMS rates may apply</span>
        </div>
      </Card>
    );
  }

  return null;
};
