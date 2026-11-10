import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  Edit2,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { CustomerDetails, CustomerRecord } from '../types';
import {
  deleteCustomer,
  loadCustomers,
  saveSingleCustomer
} from '../utils/storage';

interface CustomerDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer?: (customer: Partial<CustomerDetails>) => void;
  showToast: (msg: string) => void;
}

export const CustomerDatabaseModal: React.FC<CustomerDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  showToast
}) => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // In-UI delete confirmation state (NEVER use window.confirm)
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRecord | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const refreshList = () => {
    setCustomers(loadCustomers());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      resetForm();
      setDeletingCustomer(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener('voya_customers_updated', handleUpdate);
    return () => window.removeEventListener('voya_customers_updated', handleUpdate);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setCountry('');
    setNotes('');
    setFormError('');
  };

  const handleStartEdit = (c: CustomerRecord) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setCountry(c.country || '');
    setNotes(c.notes || '');
    setFormError('');
    nameInputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Customer full name is required.');
      return;
    }

    if (editingId) {
      const existing = customers.find(c => c.id === editingId);
      if (!existing) return;

      const updated: CustomerRecord = {
        ...existing,
        name: trimmedName,
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        notes: notes.trim()
      };

      saveSingleCustomer(updated);
      showToast(`Updated profile for "${trimmedName}".`);
      resetForm();
      refreshList();
    } else {
      const newCust: CustomerRecord = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: trimmedName,
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        notes: notes.trim(),
        createdDate: new Date().toISOString(),
        lastQuotedDate: new Date().toISOString(),
        totalQuotes: 0,
        quoteIds: []
      };

      saveSingleCustomer(newCust);
      showToast(`Added "${trimmedName}" to Customer Database.`);
      resetForm();
      refreshList();
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingCustomer) return;
    deleteCustomer(deletingCustomer.id);
    if (editingId === deletingCustomer.id) resetForm();
    showToast(`Removed "${deletingCustomer.name}" from customer records.`);
    setDeletingCustomer(null);
    refreshList();
  };

  const handleUseInQuote = (c: CustomerRecord) => {
    if (onSelectCustomer) {
      onSelectCustomer({
        custName: c.name,
        custEmail: c.email || '',
        custPhone: c.phone || '',
        custCountry: c.country || '',
        custNotes: c.notes || ''
      });
      showToast(`Loaded details for customer "${c.name}".`);
      onClose();
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] relative">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Customer Database &amp; Directory</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800/80 text-sky-300">
                  {customers.length} Saved Clients
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage traveler profiles and 1-click populate active quotation forms.
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Add / Edit Customer Form */}
          <div
            className={`rounded-xl p-4 shadow-sm relative transition-all ${
              editingId
                ? 'bg-amber-950/20 border-2 border-amber-500/50'
                : 'bg-slate-950/80 border border-sky-900/40'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                {editingId ? (
                  <>
                    <Pencil className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400">Edit Customer Profile</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Customer Profile</span>
                  </>
                )}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+44 7911 123456"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Country / Nationality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. United Kingdom"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Special Notes / Travel Preferences
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, Honeymoon, Prefers 5-star beach villas"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              {formError && (
                <div className="text-xs text-rose-400 font-medium bg-rose-950/40 border border-rose-900/60 px-3 py-1.5 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer flex items-center gap-1.5 ${
                    editingId
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Update Customer Profile' : 'Save Customer Profile'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or country..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Customers Directory List */}
          <div className="border border-slate-800 rounded-xl divide-y divide-slate-800/80 max-h-72 overflow-y-auto bg-slate-950/60">
            {filtered.length > 0 ? (
              filtered.map((c, idx) => {
                const isEditing = editingId === c.id;
                return (
                  <div
                    key={c.id || idx}
                    className={`p-3 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isEditing
                        ? 'bg-amber-950/30 border-l-4 border-amber-500 pl-2'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 shrink-0 font-bold text-xs mt-0.5">
                        {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-100 text-xs truncate">
                            {c.name}
                          </span>
                          {c.country && (
                            <span className="text-[10px] text-sky-400 bg-sky-950/60 border border-sky-900/60 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {c.country}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded">
                            {c.totalQuotes || 0} Quotes
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          {c.phone && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Phone className="w-2.5 h-2.5" />
                              {c.phone}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Mail className="w-2.5 h-2.5" />
                              {c.email}
                            </span>
                          )}
                        </div>

                        {c.notes && (
                          <p className="text-[11px] text-slate-400 italic truncate max-w-md">
                            Note: {c.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      {onSelectCustomer && (
                        <button
                          type="button"
                          onClick={() => handleUseInQuote(c)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-800/80 text-sky-200 transition-colors cursor-pointer"
                        >
                          Use in Quote
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingCustomer(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  {searchQuery
                    ? `No customers found matching "${searchQuery}".`
                    : 'Customer database is currently empty.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Customers are automatically saved when you generate quotations, or you can add one using the form above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            Total: <strong className="text-slate-200">{customers.length}</strong> customer profiles in database
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* In-UI Delete Confirmation Modal */}
        {deletingCustomer && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-rose-900/60 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100">
                    Delete Customer Record?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Are you sure you want to remove <strong className="text-rose-300">{deletingCustomer.name}</strong> from your customer database?
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Existing saved quotation records will not be affected.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingCustomer(null)}
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
                  <span>Yes, Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
