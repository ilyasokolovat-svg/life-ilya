import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Check } from 'lucide-react';
import { ALL_COUNTRIES } from '@/utils/countryUtils';

interface CountrySelectorProps {
  value: string;
  onChange: (value: string, countryCode?: string) => void;
  placeholder?: string;
  className?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = "Select a country...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update search term when value changes externally
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return ALL_COUNTRIES;
    
    const term = searchTerm.toLowerCase();
    return ALL_COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue, undefined);
    setIsOpen(true);
  };

  const handleSelectCountry = (country: { code: string; name: string }) => {
    setSearchTerm(country.name);
    onChange(country.name, country.code);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Check if current value matches a country
  const selectedCountry = ALL_COUNTRIES.find(
    c => c.name.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {selectedCountry && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {isOpen && filteredCountries.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
          <ScrollArea className="h-[200px]">
            <div className="p-1">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelectCountry(country)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded hover:bg-gray-100 transition-colors ${
                    selectedCountry?.code === country.code ? 'bg-teal-50 text-teal-700' : ''
                  }`}
                >
                  <span className="font-medium">{country.name}</span>
                  <span className="text-xs text-gray-400">({country.code})</span>
                  {selectedCountry?.code === country.code && (
                    <Check className="ml-auto h-4 w-4 text-teal-500" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {isOpen && filteredCountries.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
          No countries found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
