import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  MessageCircle,
  Phone,
  Send,
  Share2,
  Sparkles,
  X
} from 'lucide-react';
import { ShareableQuotationData } from '../types';
import {
  cleanWhatsAppPhone,
  generateShareableLink,
  generateWhatsAppMessage,
  openWhatsAppDirect
} from '../utils/shareLink';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  quoteData: ShareableQuotationData;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  quoteData,
  onClose,
  showToast
}) => {
  const [phoneNumber, setPhoneNumber] = useState(quoteData.customer.custPhone || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Sync phone number when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPhoneNumber(quoteData.customer.custPhone || '');
      setCopiedLink(false);
      setCopiedMessage(false);
    }
  }, [isOpen, quoteData.customer.custPhone]);

  // Generate shareable URL
  const shareableUrl = useMemo(() => {
    return generateShareableLink(quoteData);
  }, [quoteData]);

  // Generate formatted WhatsApp message
  const whatsappMessage = useMemo(() => {
    return generateWhatsAppMessage(quoteData, shareableUrl);
  }, [quoteData, shareableUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    showToast('Shareable proposal link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedMessage(true);
    showToast('Complete WhatsApp message copied to clipboard!');
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const cleaned = cleanWhatsAppPhone(phoneNumber);
    if (!cleaned) {
      showToast('Please enter a valid phone number with country code.');
      return;
    }
    openWhatsAppDirect(phoneNumber, whatsappMessage);
    showToast(`Opening WhatsApp for ${phoneNumber}...`);
    onClose();
  };

  const handleOpenPreview = () => {
    if (shareableUrl) {
      window.open(shareableUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Share Quotation &amp; Itinerary</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                  WhatsApp &amp; Online Link
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Send a formatted summary with total cost &amp; an interactive web proposal link.
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
          {/* Shareable Link Box */}
          <div className="bg-slate-950/80 border border-sky-900/40 rounded-xl p-4 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Client Online Proposal &amp; Itinerary Web Link</span>
              </label>
              <button
                type="button"
                onClick={handleOpenPreview}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Preview Online</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono truncate focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Clients can open this link on their mobile phone or PC to view their interactive day-by-day itinerary, hotels, and proposal without needing a PDF.
            </p>
          </div>

          {/* Recipient Phone & WhatsApp Actions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recipient WhatsApp Phone Number (with Country Code)
              </label>
              <div className="relative flex items-center">
                <Phone className="w-3.5 h-3.5 absolute left-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. +94 77 123 4567 or +44 7911 123456"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Include country code (e.g. +94 for Sri Lanka, +44 for UK, +1 for US).
              </p>
            </div>

            {/* Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Pre-Formatted WhatsApp Message Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedMessage ? 'Message Copied!' : 'Copy Message Text'}</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-h-48 overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {whatsappMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMessage}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Full Message</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
