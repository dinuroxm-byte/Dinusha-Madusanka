import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Edit2,
  Filter,
  Hotel,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { HOTEL_CATEGORIES, PartnerHotel, VOYA_LANKA_PARTNER_HOTELS } from '../types';
import {
  addPartnerHotel,
  deletePartnerHotel,
  getAllPartnerHotels,
  restoreDefaultPartnerHotels,
  updatePartnerHotel
} from '../utils/storage';

interface PartnerHotelsModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  onSelectHotel?: (hotelNameFormatted: string, category: string) => void;
  showToast: (msg: string) => void;
}

const COMMON_DESTINATIONS = [
  'Sigiriya',
  'Dambulla',
  'Kandy',
  'Nuwara Eliya',
  'Ella',
  'Yala',
  'Galle',
  'Bentota',
  'Colombo',
  'Negombo',
  'Tangalle',
  'Weligama',
  'Mirissa',
  'Trincomalee',
  'Pasikudah',
  'Anuradhapura',
  'Jaffna'
];

export const PartnerHotelsModal: React.FC<PartnerHotelsModalProps> = ({
  isOpen,
  initialQuery = '',
  onClose,
  onSelectHotel,
  showToast
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState<string>(HOTEL_CATEGORIES[0]);
  const [formError, setFormError] = useState('');

  // Editing state
  const [editingHotel, setEditingHotel] = useState<PartnerHotel | null>(null);

  // In-UI Delete Confirmation state
  const [deletingHotel, setDeletingHotel] = useState<PartnerHotel | null>(null);

  // In-UI Restore Defaults Confirmation state
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'default'>('all');

  // List of all hotels
  const [hotelsList, setHotelsList] = useState<PartnerHotel[]>([]);

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Load hotels
  const refreshHotels = () => {
    setHotelsList(getAllPartnerHotels());
  };

  useEffect(() => {
    if (isOpen) {
      refreshHotels();
      setEditingHotel(null);
      setDeletingHotel(null);
      setIsRestoreConfirmOpen(false);
      setFormError('');

      if (initialQuery) {
        setName(initialQuery);
        setSearchQuery(initialQuery);
      } else {
        setName('');
        setDestination('');
        setCategory(HOTEL_CATEGORIES[0]);
      }
    }
  }, [isOpen, initialQuery]);

  // Listen for storage changes from other components
  useEffect(() => {
    const handleUpdate = () => refreshHotels();
    window.addEventListener('voya_partner_hotels_updated', handleUpdate);
    return () => window.removeEventListener('voya_partner_hotels_updated', handleUpdate);
  }, []);

  const isPredefinedDefault = (hotel: PartnerHotel): boolean => {
    return VOYA_LANKA_PARTNER_HOTELS.some(
      dh =>
        dh.name.toLowerCase().trim() === hotel.name.toLowerCase().trim() &&
        dh.destination.toLowerCase().trim() === hotel.destination.toLowerCase().trim()
    );
  };

  const handleStartEdit = (hotel: PartnerHotel) => {
    setEditingHotel(hotel);
    setName(hotel.name);
    setDestination(hotel.destination);
    setCategory(hotel.category || HOTEL_CATEGORIES[0]);
    setFormError('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingHotel(null);
    setName('');
    setDestination('');
    setCategory(HOTEL_CATEGORIES[0]);
    setFormError('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const trimmedDest = destination.trim();

    if (!trimmedName) {
      setFormError('Hotel name cannot be empty.');
      return;
    }
    if (!trimmedDest) {
      setFormError('Destination / City cannot be empty.');
      return;
    }

    if (editingHotel) {
      // Update existing partner hotel
      const res = updatePartnerHotel(editingHotel, {
        name: trimmedName,
        destination: trimmedDest,
        category
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }

      showToast(res.message);
      setEditingHotel(null);
      setName('');
      setDestination('');
      setCategory(HOTEL_CATEGORIES[0]);
      refreshHotels();
    } else {
      // Add new partner hotel
      const res = addPartnerHotel({
        name: trimmedName,
        destination: trimmedDest,
        category
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }

      showToast(res.message);
      const addedFormatted = `${trimmedName} - ${trimmedDest}`;
      const addedCategory = category;

      setName('');
      setDestination('');
      setCategory(HOTEL_CATEGORIES[0]);
      refreshHotels();

      if (onSelectHotel) {
        onSelectHotel(addedFormatted, addedCategory);
        onClose();
      }
    }
  };

  // In-UI deletion confirmation handler
  const handleConfirmDelete = () => {
    if (!deletingHotel) return;
    const target = deletingHotel;
    const res = deletePartnerHotel(target);
    setDeletingHotel(null);

    // If we were currently editing the deleted hotel, cancel edit
    if (
      editingHotel &&
      editingHotel.name.toLowerCase() === target.name.toLowerCase() &&
      editingHotel.destination.toLowerCase() === target.destination.toLowerCase()
    ) {
      handleCancelEdit();
    }

    refreshHotels();
    showToast(res.message || `Deleted "${target.name}" from partner directory.`);
  };

  // In-UI restore defaults confirmation handler
  const handleConfirmRestore = () => {
    const res = restoreDefaultPartnerHotels();
    setIsRestoreConfirmOpen(false);
    handleCancelEdit();
    refreshHotels();
    showToast(res.message);
  };

  const filteredHotels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return hotelsList.filter(h => {
      const isDefault = isPredefinedDefault(h);
      if (filterType === 'custom' && isDefault) return false;
      if (filterType === 'default' && !isDefault) return false;

      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.destination.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q)
      );
    });
  }, [hotelsList, searchQuery, filterType]);

  const customCount = useMemo(() => {
    return hotelsList.filter(h => !isPredefinedDefault(h)).length;
  }, [hotelsList]);

  const defaultCount = useMemo(() => {
    return hotelsList.filter(h => isPredefinedDefault(h)).length;
  }, [hotelsList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] relative">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Trusted Hotel Partners Directory</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800/60 text-sky-300">
                  {hotelsList.length} Partners
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Add, edit, or remove partner hotels for seamless accommodation selection &amp; vouchers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Add / Edit Partner Form */}
          <div
            ref={formRef}
            className={`rounded-xl p-4 shadow-sm relative overflow-hidden transition-all duration-200 ${
              editingHotel
                ? 'bg-amber-950/25 border-2 border-amber-500/60 ring-1 ring-amber-500/30'
                : 'bg-slate-950/80 border border-sky-900/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {editingHotel ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Partner Hotel:</span>
                    <span className="text-slate-200 underline font-semibold max-w-[200px] truncate">
                      {editingHotel.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Partner Hotel</span>
                  </div>
                )}
              </div>

              {editingHotel ? (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel Edit</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400">
                  Custom &amp; edited hotels persist in your browser
                </span>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Hotel Name */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Hotel Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="e.g. Cinnamon Bentota Beach"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Destination */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Destination / City *
                  </label>
                  <input
                    type="text"
                    required
                    list="partner-destinations"
                    placeholder="e.g. Bentota"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  <datalist id="partner-destinations">
                    {COMMON_DESTINATIONS.map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                {/* Category */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Hotel Class / Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                  >
                    {HOTEL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Destination Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-500">Quick Destination:</span>
                {['Sigiriya', 'Kandy', 'Nuwara Eliya', 'Ella', 'Yala', 'Galle', 'Bentota', 'Colombo'].map(dest => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestination(dest)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      destination.toLowerCase() === dest.toLowerCase()
                        ? 'border-sky-500 bg-sky-950 text-sky-300 font-semibold'
                        : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>

              {formError && (
                <div className="text-xs text-rose-400 font-medium bg-rose-950/40 border border-rose-900/60 px-3 py-1.5 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingHotel && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
                    editingHotel
                      ? 'bg-amber-600 hover:bg-amber-500 text-white font-bold'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {editingHotel ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Partner Hotel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Search, Filter & Actions Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search directory by hotel name, city, or star class..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Filter Tabs & Restore */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-slate-800 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({hotelsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('default')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      filterType === 'default'
                        ? 'bg-sky-950 border border-sky-800/80 text-sky-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Predefined ({defaultCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('custom')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      filterType === 'custom'
                        ? 'bg-emerald-950 border border-emerald-800/80 text-emerald-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom ({customCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRestoreConfirmOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Reset to default Voya Lanka partner hotels catalog"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Restore Defaults</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="border border-slate-800 rounded-xl divide-y divide-slate-800/80 max-h-72 overflow-y-auto bg-slate-950/60">
              {filteredHotels.length > 0 ? (
                filteredHotels.map((h, idx) => {
                  const isDefault = isPredefinedDefault(h);
                  const isCurrentEditing =
                    editingHotel &&
                    editingHotel.name.toLowerCase() === h.name.toLowerCase() &&
                    editingHotel.destination.toLowerCase() === h.destination.toLowerCase();
                  const fullFormatted = `${h.name} - ${h.destination}`;

                  return (
                    <div
                      key={`${h.name}-${h.destination}-${idx}`}
                      className={`p-3 transition-colors flex items-center justify-between gap-3 text-xs ${
                        isCurrentEditing
                          ? 'bg-amber-950/30 border-l-4 border-amber-500 pl-2'
                          : 'hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            isCurrentEditing
                              ? 'bg-amber-950 border-amber-700/60 text-amber-300'
                              : isDefault
                              ? 'bg-sky-950/70 border-sky-800/60 text-sky-300'
                              : 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300'
                          }`}
                        >
                          <Hotel className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-xs truncate">
                              {h.name}
                            </span>
                            {isCurrentEditing ? (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 border border-amber-700/60 px-1.5 py-0.5 rounded">
                                Currently Editing
                              </span>
                            ) : isDefault ? (
                              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                Predefined
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/90 border border-emerald-700/60 px-1.5 py-0.5 rounded">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1 text-sky-400">
                              <MapPin className="w-3 h-3" />
                              {h.destination}
                            </span>
                            <span>&bull;</span>
                            <span className="text-amber-400 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400/20" />
                              {h.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onSelectHotel && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectHotel(fullFormatted, h.category);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-800/80 text-sky-200 transition-colors cursor-pointer"
                          >
                            Use in Room
                          </button>
                        )}

                        {/* Edit Button - available for all partner hotels */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(h)}
                          className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Edit hotel details (name, city, class)"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button - works reliably with in-UI confirmation modal */}
                        <button
                          type="button"
                          onClick={() => setDeletingHotel(h)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete from partner directory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-slate-400">No partner hotel found matching your query.</p>
                  <p className="text-[11px] text-slate-500">
                    Use the form above to add &ldquo;{searchQuery}&rdquo; as a new partner hotel!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            Total: <strong className="text-slate-200">{hotelsList.length}</strong> partners ({customCount} custom, {defaultCount} predefined)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* IN-UI DELETE CONFIRMATION DIALOG (Never uses window.confirm which is blocked in iframes) */}
        {deletingHotel && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-rose-900/60 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100">
                    Delete Partner Hotel?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Are you sure you want to remove <strong className="text-rose-300">{deletingHotel.name} - {deletingHotel.destination}</strong> from your partner directory?
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    It will no longer appear in hotel autocomplete dropdowns. You can re-add it or restore default partners at any time.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingHotel(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Hotel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IN-UI RESTORE DEFAULTS CONFIRMATION DIALOG */}
        {isRestoreConfirmOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-amber-900/60 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100">
                    Restore Default Hotel Partners?
                  </h4>
                  <p className="text-xs text-slate-300">
                    This will reset your partner directory back to the 35+ verified Voya Lanka default hotels (Heritance, Cinnamon, Jetwing, Amaya, etc.).
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Any custom edits or newly created hotels will be replaced with the default factory catalog.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRestoreConfirmOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
