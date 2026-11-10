import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, MapPin, Plus, Search, Star, X } from 'lucide-react';
import { PartnerHotel } from '../types';
import { getAllPartnerHotels } from '../utils/storage';
import { PartnerHotelsModal } from './PartnerHotelsModal';

interface HotelAutocompleteProps {
  value: string;
  onChange: (hotelName: string, category?: string) => void;
  placeholder?: string;
}

export const HotelAutocomplete: React.FC<HotelAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Select or search trusted partner hotel...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allHotels, setAllHotels] = useState<PartnerHotel[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all partner hotels from storage & predefined
  const loadHotels = () => {
    setAllHotels(getAllPartnerHotels());
  };

  useEffect(() => {
    loadHotels();
  }, []);

  // Listen for storage events when hotels are added or deleted anywhere in the app
  useEffect(() => {
    const handleUpdate = () => loadHotels();
    window.addEventListener('voya_partner_hotels_updated', handleUpdate);
    return () => window.removeEventListener('voya_partner_hotels_updated', handleUpdate);
  }, []);

  // Sync internal query when value prop changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredHotels = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return allHotels;
    return allHotels.filter(
      h =>
        h.name.toLowerCase().includes(q) ||
        h.destination.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q)
    );
  }, [query, allHotels]);

  const handleSelect = (hotel: PartnerHotel) => {
    const formatted = `${hotel.name} - ${hotel.destination}`;
    setQuery(formatted);
    onChange(formatted, hotel.category);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);
    setIsOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              loadHotels();
              setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-14 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors cursor-pointer"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                loadHotels();
                setIsOpen(!isOpen);
              }}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-sky-400' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/60">
            {/* Header with Add Partner button */}
            <div className="p-2 bg-slate-950/95 sticky top-0 flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800/80 z-10">
              <span className="font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Trusted Hotel Partners
              </span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className="text-sky-300 hover:text-sky-100 flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-sky-950 border border-sky-800/70 hover:bg-sky-900/70 transition-colors cursor-pointer"
                title="Add new partner hotel to predefined directory"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>+ Add Partner</span>
              </button>
            </div>

            {/* List */}
            {filteredHotels.length > 0 ? (
              <>
                {filteredHotels.map((hotel, idx) => {
                  const fullFormatted = `${hotel.name} - ${hotel.destination}`;
                  const isSelected = value.toLowerCase().includes(hotel.name.toLowerCase());

                  return (
                    <div
                      key={`${hotel.name}-${hotel.destination}-${idx}`}
                      onClick={() => handleSelect(hotel)}
                      className={`p-2.5 hover:bg-slate-800/70 cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs ${
                        isSelected ? 'bg-sky-950/40 text-sky-200' : 'text-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold truncate text-slate-100">
                            {hotel.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-sky-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 text-sky-400/90">
                            <MapPin className="w-2.5 h-2.5" />
                            {hotel.destination}
                          </span>
                          <span>&bull;</span>
                          <span className="text-amber-400/90 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400/30" />
                            {hotel.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Footer bar */}
                <div className="p-2 bg-slate-950/95 sticky bottom-0 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] text-slate-500">
                    {filteredHotels.length} partner hotels
                  </span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Manage / Add Partners</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 space-y-2.5">
                <p>No partner hotel found matching &ldquo;{query}&rdquo;.</p>
                <div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add &ldquo;{query || 'New Hotel'}&rdquo; as Partner</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Click away to keep &ldquo;{query}&rdquo; for this accommodation only.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for adding/managing hotel partners */}
      <PartnerHotelsModal
        isOpen={isModalOpen}
        initialQuery={query}
        onClose={() => setIsModalOpen(false)}
        onSelectHotel={(formatted, category) => {
          setQuery(formatted);
          onChange(formatted, category);
          setIsOpen(false);
        }}
        showToast={msg => {
          // Toast or event
          window.dispatchEvent(new CustomEvent('voya_show_toast', { detail: msg }));
        }}
      />
    </>
  );
};
