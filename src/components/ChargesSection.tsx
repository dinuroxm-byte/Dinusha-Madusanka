import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  DollarSign,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Ticket,
  Trash2,
  X
} from 'lucide-react';
import { EntranceTicketCatalogItem, OtherCharge, PricingConfig } from '../types';
import { formatLKR, formatNumber } from '../utils/calc';
import {
  addTicketCatalogItem,
  deleteTicketCatalogItem,
  loadTicketCatalog,
  restoreDefaultTicketCatalog,
  updateTicketCatalogItem
} from '../utils/storage';

interface ChargesSectionProps {
  pricing: PricingConfig;
  others: OtherCharge[];
  onPricingChange: (fields: Partial<PricingConfig>) => void;
  onOthersChange: (others: OtherCharge[]) => void;
  showToast?: (msg: string) => void;
}

export const ChargesSection: React.FC<ChargesSectionProps> = ({
  pricing,
  others,
  onPricingChange,
  onOthersChange,
  showToast
}) => {
  const [ticketCatalog, setTicketCatalog] = useState<EntranceTicketCatalogItem[]>(() =>
    loadTicketCatalog()
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string>('sigiriya');

  // Management Modal state
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState('');

  // Inline edit state within manager
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriceUsd, setEditPriceUsd] = useState<number>(36);
  const [editCategory, setEditCategory] = useState('');

  // New ticket state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPriceUsd, setNewPriceUsd] = useState<number>(25);
  const [newCategory, setNewCategory] = useState('Attraction / Activity');

  // Delete confirmation state in manager
  const [deletingTicket, setDeletingTicket] = useState<EntranceTicketCatalogItem | null>(null);

  // Reload ticket catalog on external updates
  useEffect(() => {
    const handleUpdate = () => {
      setTicketCatalog(loadTicketCatalog());
    };
    window.addEventListener('voya_tickets_updated', handleUpdate);
    return () => window.removeEventListener('voya_tickets_updated', handleUpdate);
  }, []);

  const otherSubtotal = others.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);
  const visibleInQuoteCount = others.filter(o => o.showInQuotation !== false).length;

  // Add a ticket box from the selected dropdown item
  const handleAddTicketFromDropdown = () => {
    const catalogItem = ticketCatalog.find(t => t.id === selectedTicketId) || ticketCatalog[0];
    if (!catalogItem) return;

    const rate = pricing.usdRate || 305;
    const usdPrice =
      catalogItem.priceUsd !== undefined
        ? catalogItem.priceUsd
        : Math.round((catalogItem.priceLkr || 0) / rate) || 10;
    const lkrPrice = Math.round(usdPrice * rate);

    const newItem: OtherCharge = {
      id: 'tkt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: catalogItem.name,
      cost: lkrPrice,
      unitPrice: lkrPrice,
      unitPriceUsd: usdPrice,
      qty: 1,
      showInQuotation: true, // Default checked: shown in quotation
      showPriceInQuotation: true, // Default checked: show USD price in quotation
      isTicket: true
    };

    onOthersChange([...others, newItem]);
    if (showToast) {
      showToast(`Added "${catalogItem.name}" ($${usdPrice} USD) to quotation!`);
    }
  };

  // Add a blank custom charge box
  const handleAddBlankOther = () => {
    const rate = pricing.usdRate || 305;
    const defaultUsd = 20;
    const defaultLkr = Math.round(defaultUsd * rate);

    const newItem: OtherCharge = {
      id: 'oth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: 'Custom Activity / Charge',
      cost: defaultLkr,
      unitPrice: defaultLkr,
      unitPriceUsd: defaultUsd,
      qty: 1,
      showInQuotation: true,
      showPriceInQuotation: true,
      isTicket: false
    };
    onOthersChange([...others, newItem]);
  };

  // Save a new item into the dropdown catalog
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      if (showToast) showToast('Please enter a ticket or activity name.');
      return;
    }

    const rate = pricing.usdRate || 305;
    const res = addTicketCatalogItem(newName, newPriceUsd, newCategory, Math.round(newPriceUsd * rate));
    if (res.success) {
      setTicketCatalog(res.items);
      const addedItem = res.items.find(i => i.name.toLowerCase() === newName.trim().toLowerCase());
      if (addedItem) {
        setSelectedTicketId(addedItem.id);
      }
      setNewName('');
      setNewPriceUsd(25);
      setIsAddingNew(false);
      if (showToast) showToast(res.message);
    } else {
      if (showToast) showToast(res.message);
    }
  };

  const handleStartEdit = (item: EntranceTicketCatalogItem) => {
    setEditingTicketId(item.id);
    setEditName(item.name);
    setEditPriceUsd(item.priceUsd);
    setEditCategory(item.category || '');
  };

  const handleSaveEdit = (id: string) => {
    const rate = pricing.usdRate || 305;
    const res = updateTicketCatalogItem(id, {
      name: editName,
      priceUsd: editPriceUsd,
      category: editCategory,
      priceLkr: Math.round(editPriceUsd * rate)
    });
    if (res.success) {
      setTicketCatalog(res.items);
      setEditingTicketId(null);
      if (showToast) showToast(res.message);
    } else {
      if (showToast) showToast(res.message);
    }
  };

  const handleConfirmDelete = (id: string) => {
    const res = deleteTicketCatalogItem(id);
    setTicketCatalog(res.items);
    if (selectedTicketId === id && res.items.length > 0) {
      setSelectedTicketId(res.items[0].id);
    }
    setDeletingTicket(null);
    if (showToast) showToast(res.message);
  };

  const handleRestoreDefaults = () => {
    const res = restoreDefaultTicketCatalog();
    setTicketCatalog(res.items);
    if (showToast) showToast(res.message);
  };

  const handleUpdateOther = (index: number, fields: Partial<OtherCharge>) => {
    const updated = [...others];
    const current = { ...updated[index], ...fields };
    const rate = pricing.usdRate || 305;

    // If unitPriceUsd or qty changed
    if (fields.unitPriceUsd !== undefined || fields.qty !== undefined) {
      const upUsd = fields.unitPriceUsd !== undefined ? fields.unitPriceUsd : current.unitPriceUsd || 0;
      const q = fields.qty !== undefined ? fields.qty : current.qty || 1;
      const upLkr = Math.round(upUsd * rate);
      current.unitPriceUsd = upUsd;
      current.unitPrice = upLkr;
      current.cost = Math.round(upLkr * q);
    } else if (fields.unitPrice !== undefined) {
      const upLkr = fields.unitPrice;
      const q = current.qty || 1;
      current.unitPrice = upLkr;
      current.unitPriceUsd = Math.round((upLkr / rate) * 100) / 100;
      current.cost = Math.round(upLkr * q);
    }

    updated[index] = current;
    onOthersChange(updated);
  };

  const handleDeleteOther = (index: number) => {
    onOthersChange(others.filter((_, i) => i !== index));
  };

  // Filtered tickets in the manager modal
  const filteredCatalog = ticketCatalog.filter(t => {
    const q = managerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      String(t.priceUsd).includes(q)
    );
  });

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Entrance Tickets, Activities &amp; Other Charges
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">
            Total Items: <b className="text-slate-200">{others.length}</b>
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-emerald-400">
            Shown in Quote: <b className="text-emerald-300">{visibleInQuoteCount}</b>
          </span>
        </div>
      </div>

      {/* Toll & Subtotal summary cards (Drinking Water Bottles removed as requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Expressway Toll + Parking (LKR)
          </label>
          <input
            type="number"
            min="0"
            step="500"
            value={pricing.toll}
            onChange={e =>
              onPricingChange({ toll: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Entrance Tickets &amp; Extras Subtotal (LKR)
          </label>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-teal-300 flex items-center justify-end">
            {formatLKR(otherSubtotal)}
          </div>
        </div>
      </div>

      {/* Dropdown Selection & Catalog Manager */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Attraction Entrance Ticket (Prices in USD)</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select predefined tickets shown in USD, or click &quot;Edit &amp; Manage Tickets&quot; to edit and delete predefined items.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManagerOpen(true)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Edit and delete predefined attraction tickets"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit &amp; Manage Tickets ({ticketCatalog.length})</span>
            </button>
          </div>
        </div>

        {/* Dropdown + Add to tour bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <select
              value={selectedTicketId}
              onChange={e => setSelectedTicketId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {ticketCatalog.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} — $ {t.priceUsd} USD {t.category ? `(${t.category})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddTicketFromDropdown}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-sky-700 hover:bg-sky-600 text-white transition-colors cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ticket Box</span>
          </button>

          <button
            type="button"
            onClick={handleAddBlankOther}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Add blank custom expense box"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>+ Custom Box</span>
          </button>
        </div>
      </div>

      {/* Dynamic List of Added Ticket & Charge Boxes */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300">
            Current Added Boxes &amp; Quotation Display Controls:
          </span>
          <span className="text-[11px]">
            Check the box to show in quotation output
          </span>
        </div>

        {others.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
            No entrance tickets or extra charges added yet. Select &quot;Sigiriya Rock Fortress Entrance Ticket&quot; from the dropdown above and click &quot;Add Ticket Box&quot;.
          </div>
        ) : (
          others.map((item, idx) => {
            const isShown = item.showInQuotation !== false;
            const showPrice = item.showPriceInQuotation !== false;
            const rate = pricing.usdRate || 305;
            const unitPriceUsd =
              item.unitPriceUsd !== undefined
                ? item.unitPriceUsd
                : Math.round(((item.unitPrice || item.cost) / rate) * 100) / 100;
            const qty = item.qty ?? 1;
            const totalUsd = Math.round(unitPriceUsd * qty * 100) / 100;

            return (
              <div
                key={item.id || idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isShown
                    ? 'bg-slate-950/90 border-slate-700/80 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                  {/* Left: Quotation Display Checkboxes & Description */}
                  <div className="flex-1 min-w-[220px] space-y-1.5">
                    {/* Checkboxes for Quotation Inclusion and USD Price Display */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Checkbox 1: Include in Quotation */}
                      <label
                        className="flex items-center gap-1.5 cursor-pointer select-none"
                        title="Check to include this item in quotation outputs (PDF, Print, Online Proposal, WhatsApp)"
                      >
                        <input
                          type="checkbox"
                          checked={isShown}
                          onChange={e =>
                            handleUpdateOther(idx, { showInQuotation: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
                        />
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                            isShown
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {isShown ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-400" />
                              <span>Show in Quotation</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-500" />
                              <span>Hidden from Quote</span>
                            </>
                          )}
                        </span>
                      </label>

                      {/* Checkbox 2: Show USD Price in Quotation */}
                      <label
                        className={`flex items-center gap-1.5 cursor-pointer select-none ${
                          !isShown ? 'opacity-40 pointer-events-none' : ''
                        }`}
                        title="Check to show this item's USD price in client quotation outputs. Uncheck to show only the item name without revealing the price."
                      >
                        <input
                          type="checkbox"
                          checked={showPrice}
                          disabled={!isShown}
                          onChange={e =>
                            handleUpdateOther(idx, { showPriceInQuotation: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
                        />
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                            showPrice && isShown
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-700/60'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          <DollarSign className="w-3 h-3 text-amber-400" />
                          <span>{showPrice && isShown ? 'Show USD Price in Quote' : 'Hide USD Price'}</span>
                        </span>
                      </label>
                    </div>

                    {/* Name Input */}
                    <div>
                      <input
                        type="text"
                        value={item.name}
                        placeholder="Ticket or Activity Name (e.g. Sigiriya Rock Fortress Entrance Ticket)"
                        onChange={e => handleUpdateOther(idx, { name: e.target.value })}
                        className="w-full h-9 bg-slate-900 border border-slate-800 rounded-lg px-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Right: Aligned Numeric Controls & Actions */}
                  <div className="flex items-end gap-2 shrink-0">
                    {/* Unit (USD $) */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-slate-400 mb-1 leading-none whitespace-nowrap block">
                        Unit (USD $)
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={unitPriceUsd}
                        onChange={e =>
                          handleUpdateOther(idx, {
                            unitPriceUsd: parseFloat(e.target.value) || 0
                          })
                        }
                        className="h-9 w-24 bg-slate-900 border border-slate-800 rounded-lg px-2.5 text-xs text-right font-semibold text-sky-300 focus:outline-none focus:border-sky-500"
                        title="Unit price in USD"
                      />
                    </div>

                    {/* Qty / Pax */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-slate-400 mb-1 leading-none whitespace-nowrap block">
                        Qty / Pax
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={qty}
                        onChange={e =>
                          handleUpdateOther(idx, {
                            qty: parseInt(e.target.value) || 1
                          })
                        }
                        className="h-9 w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 text-xs text-center font-bold text-slate-100 focus:outline-none focus:border-sky-500"
                        title="Quantity or number of paying travelers"
                      />
                    </div>

                    {/* Total (USD $) */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-slate-400 mb-1 leading-none whitespace-nowrap block">
                        Total (USD $)
                      </span>
                      <div
                        className="h-9 min-w-[96px] bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 flex items-center justify-end text-xs font-bold text-amber-300"
                        title="Total cost in USD"
                      >
                        $ {Math.round(totalUsd)} USD
                      </div>
                    </div>

                    {/* Delete button */}
                    <div className="flex flex-col">
                      <span className="text-[10px] opacity-0 mb-1 leading-none select-none block">
                        Del
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteOther(idx)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-rose-900/40 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 hover:border-rose-700/60 transition-colors cursor-pointer"
                        title="Remove ticket or charge box"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-bar: Quotation preview & LKR conversion */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] pt-2 border-t border-slate-800/60 mt-2.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">
                      Quotation Preview:
                    </span>
                    {!isShown ? (
                      <span className="text-slate-500 italic">Excluded from quotation output</span>
                    ) : showPrice ? (
                      <span className="text-emerald-400 font-medium">
                        Will show: <b className="text-slate-200 font-semibold">{item.name}{qty > 1 ? ` (${qty}x)` : ''}</b> — <b className="text-amber-300 font-bold">${Math.round(totalUsd)} USD</b>
                      </span>
                    ) : (
                      <span className="text-sky-300 font-medium">
                        Will show: <b className="text-slate-200 font-semibold">{item.name}{qty > 1 ? ` (${qty}x)` : ''}</b> <span className="text-slate-400 italic">(USD price hidden from client)</span>
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    ≈ {formatLKR(Math.round(totalUsd * rate))} <span className="text-slate-600">(@ {rate} LKR/USD)</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Edit & Manage Predefined Attraction Tickets */}
      {isManagerOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl my-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Attraction Tickets Directory &amp; USD Pricing
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Edit or delete predefined tickets (Sigiriya, Dambulla, Safari, etc.) or add new custom attraction options.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsManagerOpen(false);
                  setEditingTicketId(null);
                  setIsAddingNew(false);
                  setDeletingTicket(null);
                }}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {/* Controls bar: Search, Add, Restore */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search attraction tickets (e.g. Sigiriya, Safari, Kandy)..."
                    value={managerSearch}
                    onChange={e => setManagerSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(!isAddingNew);
                      setEditingTicketId(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sky-700 hover:bg-sky-600 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingNew ? 'Close Add Form' : 'Add New Ticket'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    title="Restore default 12 Sri Lanka attraction tickets"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Restore Defaults</span>
                  </button>
                </div>
              </div>

              {/* Add New Ticket Form */}
              {isAddingNew && (
                <form
                  onSubmit={handleSaveNewItem}
                  className="p-4 bg-slate-950 border border-sky-800/60 rounded-xl space-y-3"
                >
                  <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Attraction Ticket (Price in USD)</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Attraction Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pidurangala Rock Sunset Climb Ticket"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Price (USD $)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={newPriceUsd}
                        onChange={e => setNewPriceUsd(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-amber-300 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Ticket to Directory</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Confirmation Banner */}
              {deletingTicket && (
                <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      Are you sure you want to delete <b>&quot;{deletingTicket.name}&quot;</b> from the attraction tickets directory?
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDeletingTicket(null)}
                      className="px-3 py-1 rounded-lg text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(deletingTicket.id)}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Tickets List Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <div className="divide-y divide-slate-800/70 max-h-80 overflow-y-auto">
                  {filteredCatalog.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No tickets match &quot;{managerSearch}&quot;.
                    </div>
                  ) : (
                    filteredCatalog.map(item => {
                      const isEditing = editingTicketId === item.id;

                      if (isEditing) {
                        return (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-900 border-l-4 border-sky-500 space-y-2 text-xs"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] text-slate-400 mb-0.5">
                                  Ticket Name
                                </label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={e => setEditName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-0.5">
                                  Price (USD $)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={editPriceUsd}
                                  onChange={e =>
                                    setEditPriceUsd(parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-right font-bold text-amber-300 focus:outline-none focus:border-sky-500"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingTicketId(null)}
                                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(item.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-slate-900/60 transition-colors flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="font-bold text-slate-100 truncate">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono font-bold text-amber-300">
                                $ {item.priceUsd} USD
                              </span>
                              {item.category && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-slate-500">{item.category}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit ticket name and USD price"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTicket(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete ticket from directory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between rounded-b-2xl text-xs text-slate-400">
              <span>{ticketCatalog.length} Total Attraction Tickets</span>
              <button
                type="button"
                onClick={() => {
                  setIsManagerOpen(false);
                  setEditingTicketId(null);
                  setIsAddingNew(false);
                  setDeletingTicket(null);
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
