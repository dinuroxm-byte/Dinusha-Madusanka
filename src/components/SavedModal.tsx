import React, { useState } from 'react';
import { FolderOpen, Search, Trash2, X } from 'lucide-react';
import { SavedQuotation } from '../types';

interface SavedModalProps {
  isOpen: boolean;
  savedQuotes: SavedQuotation[];
  onClose: () => void;
  onLoadQuote: (quote: SavedQuotation) => void;
  onDeleteQuote: (id: string) => void;
  onClearAll: () => void;
}

export const SavedModal: React.FC<SavedModalProps> = ({
  isOpen,
  savedQuotes,
  onClose,
  onLoadQuote,
  onDeleteQuote,
  onClearAll
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingClearAll, setPendingClearAll] = useState(false);

  if (!isOpen) return null;

  const filtered = savedQuotes.filter(q => {
    const term = searchTerm.toLowerCase();
    return (
      q.id.toLowerCase().includes(term) ||
      (q.customer.custName || '').toLowerCase().includes(term) ||
      (q.customer.custCountry || '').toLowerCase().includes(term) ||
      (q.customer.custEmail || '').toLowerCase().includes(term)
    );
  });

  const handleDeleteClick = (id: string) => {
    if (pendingDeleteId === id) {
      onDeleteQuote(id);
      setPendingDeleteId(null);
    } else {
      setPendingDeleteId(id);
      setTimeout(() => setPendingDeleteId(null), 4000);
    }
  };

  const handleClearAllClick = () => {
    if (pendingClearAll) {
      onClearAll();
      setPendingClearAll(false);
    } else {
      setPendingClearAll(true);
      setTimeout(() => setPendingClearAll(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-slate-100 text-sm">
              Saved Quotations Repository
            </span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              {savedQuotes.length} Total
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Clear toolbar */}
        <div className="p-4 flex gap-3 border-b border-slate-800 bg-slate-900/60 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by ID, name, country or email..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {savedQuotes.length > 0 && (
            <button
              onClick={handleClearAllClick}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                pendingClearAll
                  ? 'bg-rose-700 border-rose-600 text-white'
                  : 'border-slate-700 text-rose-300 hover:bg-rose-950/40'
              }`}
            >
              {pendingClearAll ? 'Click again to confirm' : 'Clear History'}
            </button>
          )}
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Saved</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5 text-right">LKR</th>
                <th className="p-2.5 text-right">USD</th>
                <th className="p-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length > 0 ? (
                filtered.map(q => {
                  const days = q.pax.days || 1;
                  const nights = Math.max(0, days - 1);
                  const isPending = pendingDeleteId === q.id;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-2.5 font-mono text-sky-400 font-bold">
                        {q.id}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {new Date(q.savedAt).toLocaleDateString()}
                      </td>
                      <td className="p-2.5">
                        <span className="font-semibold text-slate-200 block">
                          {q.customer.custName || 'Valued Guest'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {q.customer.custCountry || '-'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {days} Days / {nights} Nights
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-200 tabular-nums">
                        {q.finLKR}
                      </td>
                      <td className="p-2.5 text-right font-bold text-teal-300 tabular-nums">
                        {q.finUSD}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              onLoadQuote(q);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-sky-700 hover:bg-sky-600 text-white transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteClick(q.id)}
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                              isPending
                                ? 'bg-rose-700 text-white'
                                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                            }`}
                            title="Delete quotation"
                          >
                            {isPending ? 'Sure?' : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 italic text-xs"
                  >
                    {savedQuotes.length
                      ? 'No matching records found for this query.'
                      : 'No saved quotations found yet. Click "Save Quotation Record" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
