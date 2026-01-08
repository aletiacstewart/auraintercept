import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Sparkles, X } from 'lucide-react';

interface ServiceLocationSearchProps {
  onSearch: (serviceQuery: string, locationQuery: string) => void;
  onClear: () => void;
  isSearching?: boolean;
}

export function ServiceLocationSearch({ onSearch, onClear, isSearching }: ServiceLocationSearchProps) {
  const [serviceQuery, setServiceQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceQuery.trim() || locationQuery.trim()) {
      onSearch(serviceQuery.trim(), locationQuery.trim());
    }
  };

  const handleClear = () => {
    setServiceQuery('');
    setLocationQuery('');
    onClear();
  };

  const hasSearchTerms = serviceQuery.trim() || locationQuery.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Service Type Input */}
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Service type (e.g., plumbing, HVAC, electrical)"
            className="pl-10 h-11"
            value={serviceQuery}
            onChange={(e) => setServiceQuery(e.target.value)}
          />
        </div>

        {/* Location Input */}
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Zip code or city"
            className="pl-10 h-11"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />
        </div>

        {/* Search Button */}
        <div className="flex gap-2">
          <Button type="submit" className="h-11 px-6" disabled={isSearching || !hasSearchTerms}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          {hasSearchTerms && (
            <Button type="button" variant="outline" className="h-11 px-3" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Tips */}
      <p className="text-xs text-muted-foreground">
        Search by service category and/or location to find businesses near you
      </p>
    </form>
  );
}
