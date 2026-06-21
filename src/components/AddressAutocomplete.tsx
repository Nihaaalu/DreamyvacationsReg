import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, X } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  id = 'address-input',
  placeholder = 'Search for street, city, state or country...'
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions card on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions with fallback logic
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1st Attempt: Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&countrycodes=in`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'DreamyVacationsHotelApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const results = data
            .map((item: any) => item.display_name)
            .filter((name: string) => name.toLowerCase().includes('india'))
            .slice(0, 5);
          
          if (results.length > 0) {
            setSuggestions(results);
            setLoading(false);
            return;
          }
        }
      }

      // 2nd Attempt: Photon Komoot API fallback
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=15`
      );
      if (photonResponse.ok) {
        const data = await photonResponse.json();
        if (data && data.features && data.features.length > 0) {
          const results = data.features
            .filter((feat: any) => {
              const country = feat.properties?.country;
              return country && country.toLowerCase() === 'india';
            })
            .map((feat: any) => {
              const props = feat.properties;
              const parts = [
                props.name,
                props.street,
                props.city,
                props.state,
                props.country
              ].filter(Boolean);
              return parts.join(', ');
            })
            .slice(0, 5);
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.warn('Address suggestion service unavailable:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setShowDropdown(true);
    setActiveSuggestionIndex(-1);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce triggers search after 400ms to avoid unnecessary network queries
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 400);
  };

  const selectSuggestion = (addressText: string) => {
    onChange(addressText);
    setSuggestions([]);
    setShowDropdown(false);
    setActiveSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestionIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
    setActiveSuggestionIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center w-full">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 3) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full focus:outline-none placeholder-slate-400 transition-colors truncate min-w-0 bg-transparent text-white"
        />
        {value && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors no-print"
            title="Clear Address"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute z-[100] left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 no-print animate-in fade-in slide-in-from-top-2 duration-150">
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center py-4 px-4 text-xs font-medium text-slate-500">
              <Loader2 className="animate-spin h-4 w-4 text-emerald-500 mr-2.5" />
              Searching global coordinates...
            </div>
          ) : (
            suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(item)}
                className={`w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-start transition-colors duration-75 ${
                  index === activeSuggestionIndex ? 'bg-emerald-50/75 text-emerald-900 font-medium border-l-2 border-emerald-500' : 'border-l-2 border-transparent'
                }`}
              >
                <Search className="h-3.5 w-3.5 text-slate-400 mt-0.5 mr-2.5 shrink-0" />
                <span>{item}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
