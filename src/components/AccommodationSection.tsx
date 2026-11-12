import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Calendar,
  Copy,
  FileCheck,
  FileSpreadsheet,
  Hotel,
  Plus,
  Sparkles,
  Trash2,
  Utensils
} from 'lucide-react';
import {
  BED_TYPES,
  HOTEL_CATEGORIES,
  HOTELS,
  HotelRateCard,
  MEAL_PLANS,
  NightConfig,
  ROOM_CATEGORIES,
  ROOM_VIEWS,
  RoomConfig
} from '../types';
import { HotelAutocomplete } from './HotelAutocomplete';
import { PartnerHotelsModal } from './PartnerHotelsModal';
import { calculateRoomRate } from '../utils/hotelRates';

interface AccommodationSectionProps {
  nights: NightConfig[];
  days: number;
  travelDate?: string;
  usdRate?: number;
  rateCards?: HotelRateCard[];
  onOpenRateCardsModal?: () => void;
  onNightsChange: (nights: NightConfig[], newDays?: number) => void;
  onOpenVoucher: (nightNumber: number) => void;
  onSetAllHalfBoard: () => void;
  showToast: (msg: string) => void;
}

export const AccommodationSection: React.FC<AccommodationSectionProps> = ({
  nights,
  days,
  travelDate,
  usdRate = 305,
  rateCards = [],
  onOpenRateCardsModal,
  onNightsChange,
  onOpenVoucher,
  onSetAllHalfBoard,
  showToast
}) => {
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const nightCount = Math.max(0, days - 1);

  const getNightDateObject = (nightNum: number): Date => {
    let d0: Date;
    if (travelDate) {
      d0 = new Date(travelDate + 'T00:00:00');
      if (isNaN(d0.getTime())) {
        d0 = new Date();
      }
    } else {
      d0 = new Date();
    }
    const target = new Date(d0);
    target.setDate(target.getDate() + (nightNum - 1));
    return target;
  };

  const getNightDateFormatted = (nightNum: number, shortFormat = false): string => {
    const d0 = getNightDateObject(nightNum);

    if (shortFormat) {
      return d0.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }

    return d0.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Automatically update prices according to valid dates when travelDate changes
  const prevTravelDateRef = useRef(travelDate);
  useEffect(() => {
    if (prevTravelDateRef.current === travelDate) return;
    prevTravelDateRef.current = travelDate;

    if (!rateCards || !rateCards.length || !travelDate) return;

    let hasChanges = false;
    const updated = nights.map((night, nIdx) => {
      const nightDate = getNightDateObject(night.nightNumber || nIdx + 1);
      const updatedRooms = night.rooms.map(room => {
        if (!room.hotel) return room;
        const calc = calculateRoomRate(room, rateCards, usdRate, nightDate);
        if (calc.hotelMatched && calc.totalUsd > 0 && calc.totalUsd !== room.costUsd) {
          hasChanges = true;
          return {
            ...room,
            costUsd: calc.totalUsd,
            cost: calc.totalLkr
          };
        }
        return room;
      });
      return { ...night, rooms: updatedRooms };
    });

    if (hasChanges) {
      onNightsChange(updated);
      showToast(`Hotel prices automatically updated for travel date (${travelDate})!`);
    }
  }, [travelDate, rateCards, usdRate]);

  const handleRoomChange = (
    nightIdx: number,
    roomIdx: number,
    fields: Partial<RoomConfig>
  ) => {
    const updated = [...nights];
    const targetNight = { ...updated[nightIdx] };
    const targetRooms = [...targetNight.rooms];
    const currentRoom = targetRooms[roomIdx];
    const candidateRoom = { ...currentRoom, ...fields };

    // Check if hotel, bedType, meal, roomCategory, or roomView changed
    const relevantKeys = ['hotel', 'category', 'meal', 'bedType', 'roomCategory', 'roomView'];
    const hasFieldChange = Object.keys(fields).some(k => relevantKeys.includes(k));

    // If candidate has a hotel and rate cards exist, and cost was not manually typed in this change
    if (
      hasFieldChange &&
      rateCards &&
      rateCards.length > 0 &&
      candidateRoom.hotel &&
      fields.cost === undefined &&
      fields.costUsd === undefined
    ) {
      const nightDate = getNightDateObject(targetNight.nightNumber || nightIdx + 1);
      const calc = calculateRoomRate(candidateRoom, rateCards, usdRate, nightDate);
      if (calc.hotelMatched && calc.totalUsd > 0) {
        fields.costUsd = calc.totalUsd;
        fields.cost = calc.totalLkr;
      }
    }

    targetRooms[roomIdx] = { ...currentRoom, ...fields };
    targetNight.rooms = targetRooms;
    updated[nightIdx] = targetNight;
    onNightsChange(updated);
  };

  const handleAutoPriceAllNights = () => {
    if (!rateCards || !rateCards.length) {
      showToast('No hotel rate cards loaded yet. Please upload an Excel sheet first.');
      return;
    }

    let pricedCount = 0;
    const updated = nights.map((night, nIdx) => {
      const nightDate = getNightDateObject(night.nightNumber || nIdx + 1);
      return {
        ...night,
        rooms: night.rooms.map(room => {
          if (!room.hotel) return room;
          const calc = calculateRoomRate(room, rateCards, usdRate, nightDate);
          if (calc.hotelMatched && calc.totalUsd > 0) {
            pricedCount++;
            return {
              ...room,
              costUsd: calc.totalUsd,
              cost: calc.totalLkr
            };
          }
          return room;
        })
      };
    });

    onNightsChange(updated);
    if (pricedCount > 0) {
      showToast(`Auto-priced ${pricedCount} room(s) according to their night validity dates!`);
    } else {
      showToast('No matching hotels found in rate cards for current nights.');
    }
  };

  const handleCloneRoom = (nightIdx: number, roomIdx: number) => {
    const updated = [...nights];
    const targetNight = { ...updated[nightIdx] };
    const roomToClone = targetNight.rooms[roomIdx];
    const clonedRoom: RoomConfig = {
      ...roomToClone,
      id: 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
    };
    targetNight.rooms = [
      ...targetNight.rooms.slice(0, roomIdx + 1),
      clonedRoom,
      ...targetNight.rooms.slice(roomIdx + 1)
    ];
    updated[nightIdx] = targetNight;
    onNightsChange(updated);
    showToast('Room block cloned successfully!');
  };

  const handleDeleteRoom = (nightIdx: number, roomIdx: number) => {
    const updated = [...nights];
    const targetNight = { ...updated[nightIdx] };
    if (targetNight.rooms.length <= 1) return;
    targetNight.rooms = targetNight.rooms.filter((_, idx) => idx !== roomIdx);
    updated[nightIdx] = targetNight;
    onNightsChange(updated);
  };

  const handleAddRoom = (nightIdx: number) => {
    const updated = [...nights];
    const targetNight = { ...updated[nightIdx] };
    const fallbackHotel = HOTELS[nightIdx % HOTELS.length];
    const newRoom: RoomConfig = {
      id: 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      hotel: fallbackHotel,
      category: '4-Star Premium',
      meal: 'Half-Board',
      bedType: 'Double (DBL)',
      roomCategory: 'Standard Room',
      roomView: 'Garden View',
      cost: 28000
    };

    if (rateCards && rateCards.length > 0) {
      const nightDate = getNightDateObject(targetNight.nightNumber || nightIdx + 1);
      const calc = calculateRoomRate(newRoom, rateCards, usdRate, nightDate);
      if (calc.hotelMatched && calc.totalUsd > 0) {
        newRoom.costUsd = calc.totalUsd;
        newRoom.cost = calc.totalLkr;
      }
    }

    targetNight.rooms = [...targetNight.rooms, newRoom];
    updated[nightIdx] = targetNight;
    onNightsChange(updated);
  };

  const handleMoveRoom = (nightIdx: number, roomIdx: number, direction: -1 | 1) => {
    const updated = [...nights];
    const targetNight = { ...updated[nightIdx] };
    const targetRooms = [...targetNight.rooms];
    const newIdx = roomIdx + direction;
    if (newIdx < 0 || newIdx >= targetRooms.length) return;
    const temp = targetRooms[roomIdx];
    targetRooms[roomIdx] = targetRooms[newIdx];
    targetRooms[newIdx] = temp;
    targetNight.rooms = targetRooms;
    updated[nightIdx] = targetNight;
    onNightsChange(updated);
  };

  const handleMoveNight = (nightIdx: number, direction: -1 | 1) => {
    const newIdx = nightIdx + direction;
    if (newIdx < 0 || newIdx >= nights.length) return;
    const updated = [...nights];
    const temp = updated[nightIdx];
    updated[nightIdx] = updated[newIdx];
    updated[newIdx] = temp;
    // renumber
    const renumbered = updated.map((n, i) => ({ ...n, nightNumber: i + 1 }));
    onNightsChange(renumbered);
  };

  const handleAddNewNight = () => {
    const nextNightNum = nights.length + 1;
    const newNight: RoomConfig = {
      id: 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      hotel: '',
      category: '4-Star Premium',
      meal: 'Half-Board',
      bedType: 'Double (DBL)',
      roomCategory: 'Standard Room',
      roomView: 'Garden View',
      cost: 0
    };
    const newNightsList = [
      ...nights,
      {
        nightNumber: nextNightNum,
        rooms: [newNight]
      }
    ];
    const newDays = Math.max(days, nextNightNum + 1);
    onNightsChange(newNightsList, newDays);
    showToast(`Night ${nextNightNum} added!`);
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Accommodation &amp; Meal Cost Per Night
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure room types, meal plans, and night rates. Use <b className="text-amber-300">Clone Room</b> to duplicate any room configuration.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleAddNewNight}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-800/80 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            title="Add a new accommodation night"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add Night</span>
          </button>

          {onOpenRateCardsModal && (
            <button
              type="button"
              onClick={onOpenRateCardsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-teal-800/80 bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              title="Upload and inspect Excel Hotel Rate Cards"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
              <span>Hotel Rates (Excel)</span>
              {rateCards && rateCards.length > 0 && (
                <span className="bg-teal-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {rateCards.length}
                </span>
              )}
            </button>
          )}

          {rateCards && rateCards.length > 0 && (
            <button
              type="button"
              onClick={handleAutoPriceAllNights}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-800/80 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              title="Calculate prices for all nights using loaded Excel rate cards"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Price Nights</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPartnerModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-800/80 bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            title="Manage or add predefined partner hotels"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Hotel Partners</span>
          </button>

          <button
            onClick={onSetAllHalfBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Set All Half-Board</span>
          </button>
        </div>
      </div>

      {nightCount === 0 ? (
        <div className="p-6 bg-slate-950/60 rounded-xl text-center text-slate-400 text-xs border border-dashed border-slate-800 space-y-2">
          <div>No accommodation nights configured yet.</div>
          <div className="text-[11px] text-slate-500">
            Set trip duration in &quot;Pax &amp; Trip Duration&quot; above to automatically generate nights, or click &quot;+ Add Night&quot; to configure hotels.
          </div>
          <button
            type="button"
            onClick={handleAddNewNight}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-sky-700 bg-sky-950/80 hover:bg-sky-900 text-sky-300 transition-colors cursor-pointer mt-1"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>+ Add Night 1</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {nights.slice(0, nightCount).map((night, nightIdx) => {
            const currentNightNum = night.nightNumber || nightIdx + 1;
            const nightTotalCost = night.rooms.reduce(
              (sum, r) => sum + (Number(r.cost) || 0),
              0
            );

            // Detect if any other night has the same hotel name
            const primaryHotel = (night.rooms[0]?.hotel || '').trim().toLowerCase();
            const sameHotelNights = primaryHotel
              ? nights.slice(0, nightCount).filter(n =>
                  n.rooms.some(r => (r.hotel || '').trim().toLowerCase() === primaryHotel)
                )
              : [];
            const isSharedHotel = sameHotelNights.length > 1;

            return (
              <div
                key={currentNightNum}
                className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3"
              >
                {/* Night Card Header - Styled to match exact specification: [ N1 ] Fri, 11 Dec 2026 (Night 1) (Total: LKR 28,000) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <div className="h-8 min-w-[2.25rem] px-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center shadow-sm select-none">
                      N{currentNightNum}
                    </div>
                    <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                      {getNightDateFormatted(currentNightNum)}
                    </span>
                    <span className="text-slate-400 text-xs sm:text-sm font-normal">
                      (Night {currentNightNum})
                    </span>
                    <span className="text-slate-400 text-xs sm:text-sm font-normal">
                      (Total:{' '}
                      <span className="text-amber-400 font-bold">
                        ${(nightTotalCost / (usdRate || 305)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px] font-normal">
                        ≈ LKR {nightTotalCost.toLocaleString()}
                      </span>
                      )
                    </span>
                    {isSharedHotel && (
                      <span className="text-[10px] font-medium text-teal-300 bg-teal-950/80 border border-teal-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                        Shares hotel with {sameHotelNights.filter(n => (n.nightNumber || 0) !== currentNightNum).map(n => getNightDateFormatted(n.nightNumber || 1, true)).join(', ')} (Combined in 1 Voucher)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleMoveNight(nightIdx, -1)}
                      disabled={nightIdx === 0}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded bg-slate-900"
                      title="Move night up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveNight(nightIdx, 1)}
                      disabled={nightIdx === nightCount - 1}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded bg-slate-900"
                      title="Move night down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenVoucher(currentNightNum)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-emerald-800/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 transition-colors cursor-pointer"
                      title={isSharedHotel ? 'Export combined voucher for this hotel' : 'Export room voucher'}
                    >
                      <FileCheck className="w-3 h-3" />
                      <span>{isSharedHotel ? 'Export Combined Voucher' : 'Export Voucher'}</span>
                    </button>

                    <button
                      onClick={() => handleAddRoom(nightIdx)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-sky-800/60 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Another Room</span>
                    </button>
                  </div>
                </div>

                {/* Rooms list */}
                <div className="space-y-3">
                  {night.rooms.map((room, roomIdx) => (
                    <div
                      key={room.id || roomIdx}
                      className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-3"
                    >
                      {/* Room row header */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <Hotel className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px] font-semibold text-amber-400">
                            Room {roomIdx + 1} Configuration
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleMoveRoom(nightIdx, roomIdx, -1)}
                            disabled={roomIdx === 0}
                            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded bg-slate-950"
                            title="Move room up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveRoom(nightIdx, roomIdx, 1)}
                            disabled={roomIdx === night.rooms.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded bg-slate-950"
                            title="Move room down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleCloneRoom(nightIdx, roomIdx)}
                            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border border-amber-800/60 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Clone Room</span>
                          </button>

                          {night.rooms.length > 1 && (
                            <button
                              onClick={() => handleDeleteRoom(nightIdx, roomIdx)}
                              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border border-rose-900/60 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 1: Hotel name, category, meal, occupancy */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Hotel Name
                          </label>
                          <HotelAutocomplete
                            value={room.hotel}
                            onChange={(hotel, category) =>
                              handleRoomChange(nightIdx, roomIdx, {
                                hotel,
                                ...(category ? { category } : {})
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Hotel Category
                          </label>
                          <select
                            value={room.category}
                            onChange={e =>
                              handleRoomChange(nightIdx, roomIdx, { category: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            {HOTEL_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Meal Plan
                          </label>
                          <select
                            value={room.meal}
                            onChange={e =>
                              handleRoomChange(nightIdx, roomIdx, { meal: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            {MEAL_PLANS.map(m => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Occupancy / Bed
                          </label>
                          <select
                            value={room.bedType}
                            onChange={e =>
                              handleRoomChange(nightIdx, roomIdx, { bedType: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            {BED_TYPES.map(b => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Room category, view, rate */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Room Category
                          </label>
                          <select
                            value={room.roomCategory}
                            onChange={e =>
                              handleRoomChange(nightIdx, roomIdx, { roomCategory: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            {ROOM_CATEGORIES.map(rc => (
                              <option key={rc} value={rc}>
                                {rc}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            Room View
                          </label>
                          <select
                            value={room.roomView}
                            onChange={e =>
                              handleRoomChange(nightIdx, roomIdx, { roomView: e.target.value })
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
                          >
                            {ROOM_VIEWS.map(rv => (
                              <option key={rv} value={rv}>
                                {rv}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-medium text-slate-400">
                              Room Rate / Night (USD)
                            </label>
                            {(() => {
                              const nightDate = getNightDateObject(night.nightNumber || nightIdx + 1);
                              const calc = calculateRoomRate(room, rateCards || [], usdRate, nightDate);
                              if (calc.hotelMatched && calc.totalUsd > 0 && (room.costUsd === undefined || room.costUsd !== calc.totalUsd)) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleRoomChange(nightIdx, roomIdx, {
                                      costUsd: calc.totalUsd,
                                      cost: calc.totalLkr
                                    })}
                                    className="text-[9px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                                    title="Click to apply Excel rate"
                                  >
                                    Apply ${calc.totalUsd}
                                  </button>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={
                                room.costUsd !== undefined
                                  ? (room.costUsd === 0 ? '' : room.costUsd)
                                  : room.cost
                                  ? Math.round((room.cost / (usdRate || 305)) * 100) / 100
                                  : ''
                              }
                              placeholder="0.00"
                              onChange={e => {
                                const valStr = e.target.value;
                                if (valStr === '') {
                                  handleRoomChange(nightIdx, roomIdx, { cost: 0, costUsd: 0 });
                                  return;
                                }
                                const valUsd = parseFloat(valStr) || 0;
                                const valLkr = Math.round(valUsd * (usdRate || 305));
                                handleRoomChange(nightIdx, roomIdx, {
                                  cost: valLkr,
                                  costUsd: valUsd
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-right font-bold text-amber-300 focus:outline-none focus:border-amber-400 transition-colors"
                            />
                          </div>
                          {(room.cost > 0 || (room.costUsd !== undefined && room.costUsd > 0)) && (
                            <span className="block text-[10px] text-slate-500 text-right mt-0.5">
                              ≈ LKR {(room.cost || 0).toLocaleString()}
                            </span>
                          )}

                          {(() => {
                            const nightDate = getNightDateObject(night.nightNumber || nightIdx + 1);
                            const calc = calculateRoomRate(room, rateCards || [], usdRate, nightDate);
                            if (calc.hotelMatched && calc.totalUsd > 0) {
                              return (
                                <div className="mt-1.5 p-1.5 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-[10px] space-y-1 animate-in fade-in">
                                  <div className="flex items-center justify-between text-emerald-300 font-bold">
                                    <span className="flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-emerald-400" />
                                      <span>Excel Rate Matched:</span>
                                    </span>
                                    <span className="text-emerald-400 font-extrabold">${calc.totalUsd}</span>
                                  </div>
                                  {calc.validDateRangeStr && (
                                    <div className="flex items-center flex-wrap gap-1 text-[9px] text-amber-300 font-medium bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded">
                                      <Calendar className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                                      <span>Validity: {calc.validDateRangeStr}</span>
                                      {nightDate && (
                                        <span className="text-slate-400">
                                          (Date: {nightDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="text-[9px] text-slate-300 leading-relaxed font-mono">
                                    <span className="text-slate-400">Bed:</span> ${calc.breakdown.bed.rate} +{' '}
                                    <span className="text-slate-400">Meal:</span> ${calc.breakdown.meal.rate} +{' '}
                                    <span className="text-slate-400">Category:</span> ${calc.breakdown.category.rate} +{' '}
                                    <span className="text-slate-400">View:</span> ${calc.breakdown.view.rate} ={' '}
                                    <span className="text-emerald-300 font-bold">${calc.totalUsd}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partner Hotels Directory & Management Modal */}
      <PartnerHotelsModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        showToast={showToast}
      />
    </section>
  );
};
