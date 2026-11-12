import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Info,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Utensils,
  X
} from 'lucide-react';
import { HotelRateCard } from '../types';
import {
  DEFAULT_HOTEL_RATES,
  downloadSampleRatesTemplate,
  parseHotelRatesExcel,
  saveHotelRatesToLocal
} from '../utils/hotelRates';

interface HotelRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateCards: HotelRateCard[];
  onRateCardsChange: (cards: HotelRateCard[]) => void;
  onApplyToNights?: () => void;
  showToast: (msg: string) => void;
}

export const HotelRatesModal: React.FC<HotelRatesModalProps> = ({
  isOpen,
  onClose,
  rateCards,
  onRateCardsChange,
  onApplyToNights,
  showToast
}) => {
  const [selectedHotelIndex, setSelectedHotelIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentHotel = rateCards[selectedHotelIndex] || rateCards[0];

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    setUploadSuccess('');
    setIsUploading(true);

    try {
      const buffer = await file.arrayBuffer();
      const { rateCards: parsedCards, warnings } = await parseHotelRatesExcel(buffer);

      if (!parsedCards.length) {
        throw new Error('No hotel rates could be parsed from the uploaded file.');
      }

      // Merge with existing cards based on hotelName AND validDateRangeStr
      const cardKey = (c: HotelRateCard) => `${c.hotelName.toLowerCase().trim()}__${c.validDateRangeStr || ''}`;
      const newKeys = new Set(parsedCards.map(cardKey));
      const preservedCards = rateCards.filter((c) => !newKeys.has(cardKey(c)));
      const combined = [...parsedCards, ...preservedCards];

      onRateCardsChange(combined);
      saveHotelRatesToLocal(combined);
      setSelectedHotelIndex(0);

      const msg = `Successfully loaded ${parsedCards.length} hotel rate card(s): ${parsedCards
        .map((c) => c.hotelName)
        .join(', ')}`;
      setUploadSuccess(msg);
      showToast(`Loaded ${parsedCards.length} hotel rate card(s) from Excel!`);
    } catch (err: any) {
      console.error('Failed to parse Excel:', err);
      setUploadError(
        err?.message ||
          'Failed to parse Excel file. Please ensure it follows the sample rate card format.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRestoreSample = () => {
    onRateCardsChange(DEFAULT_HOTEL_RATES);
    saveHotelRatesToLocal(DEFAULT_HOTEL_RATES);
    setSelectedHotelIndex(0);
    setUploadSuccess('Restored sample hotel rates (Taj Samudra & Aliya Resort & Spa).');
    showToast('Sample hotel rates restored!');
  };

  const handleDeleteCard = (indexToDelete: number) => {
    const target = rateCards[indexToDelete];
    const updated = rateCards.filter((_, idx) => idx !== indexToDelete);
    onRateCardsChange(updated);
    saveHotelRatesToLocal(updated);
    if (selectedHotelIndex >= updated.length) {
      setSelectedHotelIndex(Math.max(0, updated.length - 1));
    }
    showToast(`Removed rate card for "${target.hotelName}".`);
  };

  // Filtered hotel list for tabs
  const filteredHotels = rateCards.filter((card) =>
    card.hotelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Hotel Rate Cards &amp; Automated Pricing
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  {rateCards.length} {rateCards.length === 1 ? 'Hotel' : 'Hotels'} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Upload your contract Excel rates. The system automatically computes rates based on
                selected hotel, bed type, meal plan, room category, and view.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleRatesTemplate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Download exact sample Excel spreadsheet matching your screenshot"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Excel Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / Notification Banners */}
        {uploadSuccess && (
          <div className="px-5 py-2.5 bg-emerald-950/60 border-b border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
            <button
              onClick={() => setUploadSuccess('')}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {uploadError && (
          <div className="px-5 py-2.5 bg-rose-950/60 border-b border-rose-500/40 text-xs text-rose-300 flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError('')}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body: Split into Upload Zone + Rate Matrix Inspector */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Top Zone: Drag-and-drop Excel Upload & Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Drag & Drop Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`lg:col-span-2 border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-400 bg-emerald-950/20'
                  : 'border-slate-700/80 bg-slate-950/50 hover:border-emerald-500/60 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mb-2 shadow-inner">
                {isUploading ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                ) : (
                  <Upload className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                {isUploading
                  ? 'Parsing Excel File...'
                  : 'Click or Drag & Drop Excel File Here'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                Upload your hotel contract rate sheet (.xlsx, .xls, .csv). Supports the multi-hotel
                column matrix format with occupancy, meal plans, room categories, and views.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  .xlsx
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  .xls
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  .csv
                </span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Sample Rates &amp; Template</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Need a starting point? Download our pre-formatted template or reload sample rates
                  for <b className="text-slate-300">Taj Samudra</b> &amp;{' '}
                  <b className="text-slate-300">Aliya Resort &amp; Spa</b>.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={downloadSampleRatesTemplate}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreSample}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Load Sample Rates</span>
                </button>
              </div>
            </div>
          </div>

          {/* Rate Card Matrix Viewer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Toolbar: Hotel Selector Tabs & Search */}
            <div className="p-3.5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Hotels:
                </span>
                {filteredHotels.map((card, idx) => {
                  const actualIndex = rateCards.findIndex((c) => c.id === card.id);
                  const isSelected = actualIndex === selectedHotelIndex;
                  return (
                    <button
                      key={card.id || `${card.hotelName}-${actualIndex}`}
                      onClick={() => setSelectedHotelIndex(actualIndex)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{card.hotelName}</span>
                      {card.validDateRangeStr && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            isSelected
                              ? 'bg-slate-950/25 text-slate-950 font-black'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {card.validDateRangeStr}
                        </span>
                      )}
                      {card.hotelCategory && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-slate-950/30 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {card.hotelCategory}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-48 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter hotels..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Hotel Rates Content */}
            {currentHotel ? (
              <div className="p-5 space-y-5">
                {/* Active Hotel Summary Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{currentHotel.hotelName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-700/60 text-sky-300 font-semibold">
                          {currentHotel.hotelCategory || '5-star'}
                        </span>
                      </h4>
                      {currentHotel.validDateRangeStr && (
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-300 font-semibold flex items-center gap-1.5 shadow-sm">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Rate Valid: {currentHotel.validDateRangeStr}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Currency: <b className="text-amber-300">{currentHotel.currency || 'USD'}</b> |
                      Rates are automatically combined for quotations based on travel dates.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(selectedHotelIndex)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Hotel</span>
                    </button>
                  </div>
                </div>

                {/* 4-Column Grid for Rate Matrix Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Occupancy / Bed Types */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Occupancy / Bed</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Base Rate</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {Object.keys(currentHotel.bedRates).length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-2">
                          No bed rates defined
                        </div>
                      ) : (
                        Object.entries(currentHotel.bedRates).map(([bed, rate]) => (
                          <div
                            key={bed}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-850"
                          >
                            <span className="text-slate-300 font-medium">{bed}</span>
                            <span className="font-bold text-amber-400">${rate}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 2. Meal Plans */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Meal Plans</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Supplement</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {Object.keys(currentHotel.mealRates).length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-2">
                          No meal supplements
                        </div>
                      ) : (
                        Object.entries(currentHotel.mealRates).map(([meal, rate]) => (
                          <div
                            key={meal}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-850"
                          >
                            <span className="text-slate-300 font-medium">{meal}</span>
                            <span
                              className={`font-bold ${
                                rate > 0 ? 'text-emerald-400' : 'text-slate-500'
                              }`}
                            >
                              {rate > 0 ? `+$${rate}` : '$0'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 3. Room Categories */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Room Category</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Supplement</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {Object.keys(currentHotel.roomCategoryRates).length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-2">
                          No room categories
                        </div>
                      ) : (
                        Object.entries(currentHotel.roomCategoryRates).map(([cat, rate]) => (
                          <div
                            key={cat}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-850"
                          >
                            <span className="text-slate-300 font-medium truncate max-w-[110px]" title={cat}>
                              {cat}
                            </span>
                            <span
                              className={`font-bold ${
                                rate > 0 ? 'text-teal-300' : 'text-slate-500'
                              }`}
                            >
                              {rate > 0 ? `+$${rate}` : '$0'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 4. Room Views */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Room View</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Supplement</span>
                    </div>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {Object.keys(currentHotel.roomViewRates).length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-2">
                          No room view rates
                        </div>
                      ) : (
                        Object.entries(currentHotel.roomViewRates).map(([view, rate]) => (
                          <div
                            key={view}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-850"
                          >
                            <span className="text-slate-300 font-medium truncate max-w-[110px]" title={view}>
                              {view}
                            </span>
                            <span
                              className={`font-bold ${
                                rate > 0 ? 'text-purple-300' : 'text-slate-500'
                              }`}
                            >
                              {rate > 0 ? `+$${rate}` : '$0'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Calculation Demonstration Example */}
                <div className="p-3.5 bg-slate-900 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <b className="text-amber-300 block">Automatic Price Formula:</b>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      Total Room Rate = <span className="text-sky-300">Bed Rate</span> +{' '}
                      <span className="text-amber-300">Meal Plan Supplement</span> +{' '}
                      <span className="text-teal-300">Room Category Supplement</span> +{' '}
                      <span className="text-purple-300">Room View Supplement</span>.
                      <br />
                      Example for {currentHotel.hotelName} (Double Bed + Half-Board + Standard Room + Sea View):
                      <span className="font-bold text-white ml-1">
                        ${currentHotel.bedRates['Double (DBL)'] || currentHotel.bedRates['Single'] || 0} (Bed) + $
                        {currentHotel.mealRates['Half-Board'] || 0} (Meal) + $
                        {currentHotel.roomCategoryRates['Standard Room'] || 0} (Category) + $
                        {currentHotel.roomViewRates['Sea View'] || currentHotel.roomViewRates['Garden View'] || 0} (View) = $
                        {(currentHotel.bedRates['Double (DBL)'] || currentHotel.bedRates['Single'] || 0) +
                          (currentHotel.mealRates['Half-Board'] || 0) +
                          (currentHotel.roomCategoryRates['Standard Room'] || 0) +
                          (currentHotel.roomViewRates['Sea View'] || currentHotel.roomViewRates['Garden View'] || 0)}
                        /night
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No hotel rate cards loaded yet.</p>
                <button
                  type="button"
                  onClick={handleRestoreSample}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold"
                >
                  Load Sample Rates
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            Hotel rates are saved to your company workspace and automatically price nights in the
            Accommodation section.
          </div>

          <div className="flex items-center gap-2">
            {onApplyToNights && (
              <button
                type="button"
                onClick={() => {
                  onApplyToNights();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Rates to Current Tour</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
