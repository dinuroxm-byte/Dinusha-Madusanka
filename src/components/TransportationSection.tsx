import React from 'react';
import { Bus, Fuel, User } from 'lucide-react';
import { TransportDetails, VEHICLE_OPTIONS } from '../types';
import { formatLKR } from '../utils/calc';

interface TransportationSectionProps {
  transport: TransportDetails;
  days: number;
  onTransportChange: (fields: Partial<TransportDetails>) => void;
}

export const TransportationSection: React.FC<TransportationSectionProps> = ({
  transport,
  days,
  onTransportChange
}) => {
  const vehicleCost = days * (Number(transport.vRate) || 0);
  const driverCost = days * (Number(transport.drvDay) || 0);

  const fuelKm = Number(transport.fuelKm) || 0;
  const fuelAvg = Number(transport.fuelAvg) || 10;
  const fuelPrice = Number(transport.fuelPrice) || 370;
  const fuelLiters = fuelAvg > 0 ? fuelKm / fuelAvg : 0;
  const fuelTotalCost = fuelLiters * fuelPrice;

  const handleVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    const found = VEHICLE_OPTIONS.find(v => v.label === selectedLabel);
    if (found) {
      onTransportChange({
        vehicleType: found.label,
        vRate: found.rate
      });
    } else {
      onTransportChange({ vehicleType: selectedLabel });
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Bus className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-100">
          Transportation &amp; Vehicle Cost Engine
        </h3>
      </div>

      {/* Vehicle Type, Rate & Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Vehicle Type
          </label>
          <select
            value={transport.vehicleType}
            onChange={handleVehicleSelect}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value="">Select vehicle type...</option>
            {VEHICLE_OPTIONS.map(v => (
              <option key={v.label} value={v.label}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Per Day Charge (LKR)
          </label>
          <input
            type="number"
            min="0"
            step="500"
            value={transport.vRate || ''}
            placeholder="0"
            onChange={e =>
              onTransportChange({ vRate: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Vehicle Cost ({days} Days &times; Rate)
          </label>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-sky-400 flex items-center justify-end">
            {formatLKR(vehicleCost)}
          </div>
        </div>
      </div>

      {/* Fuel Cost Formula Engine */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/90 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <Fuel className="w-3.5 h-3.5" />
          <span>Fuel Cost Formula Engine</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Total Kilometers
            </label>
            <input
              type="number"
              min="0"
              step="10"
              value={transport.fuelKm || ''}
              placeholder="0"
              onChange={e =>
                onTransportChange({ fuelKm: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Avg Consumption (KM/L)
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={transport.fuelAvg || ''}
              placeholder="10"
              onChange={e =>
                onTransportChange({ fuelAvg: parseFloat(e.target.value) || 10 })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Fuel Price / Liter (LKR)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={transport.fuelPrice || ''}
              placeholder="370"
              onChange={e =>
                onTransportChange({ fuelPrice: parseFloat(e.target.value) || 370 })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-right">
            <span className="block text-[10px] text-slate-400">Required Fuel</span>
            <span className="text-xs font-bold text-amber-300 block">
              {fuelLiters.toFixed(1)} L
            </span>
            <span className="text-xs font-bold text-amber-400 block mt-0.5">
              {formatLKR(fuelTotalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Driver Charge Per Day & Driver Total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Driver Charge - Per Day (LKR)
          </label>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <input
              type="number"
              min="0"
              step="250"
              value={transport.drvDay || ''}
              placeholder="0"
              onChange={e =>
                onTransportChange({ drvDay: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Driver Total ({days} Days &times; Rate)
          </label>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-slate-100 flex items-center justify-end">
            {formatLKR(driverCost)}
          </div>
        </div>
      </div>
    </section>
  );
};
