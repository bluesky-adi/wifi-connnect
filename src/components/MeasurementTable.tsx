import React, { useState } from 'react';
import { MeasurementPoint, SignalQualityCategory } from '../types/wifi';
import { classifySignal, getSignalTier } from '../utils/heatmap';
import { Edit2, Trash2, Filter } from 'lucide-react';

interface MeasurementTableProps {
  points: MeasurementPoint[];
  selectedPointId: string | null;
  onSelectPoint: (point: MeasurementPoint) => void;
  onEditPoint: (point: MeasurementPoint) => void;
  onDeletePoint: (pointId: string) => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
}

export const MeasurementTable: React.FC<MeasurementTableProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  onEditPoint,
  onDeletePoint,
  onClearAll,
  onLoadSamples,
}) => {
  const [filterTier, setFilterTier] = useState<string>('all');
  const [sortField, setSortField] = useState<'id' | 'rssi'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredPoints = points.filter((p) => {
    if (filterTier === 'all') return true;
    return classifySignal(p.rssi) === filterTier;
  });

  const sortedPoints = [...filteredPoints].sort((a, b) => {
    if (sortField === 'id') {
      return sortOrder === 'asc'
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id);
    } else {
      return sortOrder === 'asc' ? a.rssi - b.rssi : b.rssi - a.rssi;
    }
  });

  const toggleSort = (field: 'id' | 'rssi') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="w-full rounded-xl bg-[#191E1B] border border-[#202622] overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#141816] border-b border-[#202622]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#F0F1ED]">
            Survey Points
          </span>
          <span className="text-xs text-[#929B94] font-mono">
            ({points.length} Total)
          </span>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#191E1B] border border-[#28312B] text-xs">
            <button
              type="button"
              onClick={() => setFilterTier('all')}
              className={`px-2 py-1 rounded transition-colors ${
                filterTier === 'all'
                  ? 'bg-[#202622] text-[#F0F1ED] font-medium'
                  : 'text-[#929B94] hover:text-[#F0F1ED]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTier('weak')}
              className={`px-2 py-1 rounded transition-colors ${
                filterTier === 'weak'
                  ? 'bg-[#202622] text-[#E07A5F] font-medium'
                  : 'text-[#929B94] hover:text-[#F0F1ED]'
              }`}
            >
              Weak (&lt;-70)
            </button>
            <button
              type="button"
              onClick={() => setFilterTier('very_weak')}
              className={`px-2 py-1 rounded transition-colors ${
                filterTier === 'very_weak'
                  ? 'bg-[#202622] text-[#C87975] font-medium'
                  : 'text-[#929B94] hover:text-[#F0F1ED]'
              }`}
            >
              Critical (&lt;-80)
            </button>
          </div>

          <div className="h-4 w-px bg-[#202622]" />

          <button
            type="button"
            onClick={onLoadSamples}
            className="px-2.5 py-1 text-xs rounded bg-[#202622] text-[#9BBBA0] hover:bg-[#28312B] transition-colors whitespace-nowrap"
          >
            Reset Samples
          </button>

          {points.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-2.5 py-1 text-xs rounded bg-[#202622] text-[#C87975] hover:bg-[#C87975]/10 transition-colors whitespace-nowrap"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#202622] bg-[#141816]/50 text-[#929B94] font-medium font-mono text-[11px]">
              <th
                className="py-2 px-3 cursor-pointer hover:text-[#F0F1ED]"
                onClick={() => toggleSort('id')}
              >
                POINT ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-3">LOCATION</th>
              <th className="py-2 px-3">ROOM</th>
              <th className="py-2 px-3 font-mono">COORDS (X, Y)</th>
              <th
                className="py-2 px-3 cursor-pointer hover:text-[#F0F1ED]"
                onClick={() => toggleSort('rssi')}
              >
                RSSI (dBm) {sortField === 'rssi' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2 px-3">TIER</th>
              <th className="py-2 px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202622]">
            {sortedPoints.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#929B94]">
                  No measurement points match the selected criteria. Click on the floor plan to add a point.
                </td>
              </tr>
            ) : (
              sortedPoints.map((pt) => {
                const tierMeta = getSignalTier(pt.rssi);
                const isSelected = pt.id === selectedPointId;

                return (
                  <tr
                    key={pt.id}
                    onClick={() => onSelectPoint(pt)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#202622]/90 border-l-2 border-[#9BBBA0]'
                        : 'hover:bg-[#1C221F]'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-[#F0F1ED]">
                      {pt.id}
                      {pt.isSample && (
                        <span className="ml-1.5 text-[9.5px] text-[#667268] font-mono">
                          (Sim)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#F0F1ED] font-medium">
                      {pt.locationLabel}
                    </td>
                    <td className="py-2.5 px-3 text-[#929B94]">
                      {pt.roomName || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#929B94] tabular-nums">
                      {pt.x}, {pt.y}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold tabular-nums">
                      <span style={{ color: tierMeta.color }}>
                        {pt.rssi} dBm
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium"
                        style={{ color: tierMeta.color }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tierMeta.color }}
                        />
                        {tierMeta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPoint(pt);
                          }}
                          className="p-1 rounded text-[#929B94] hover:text-[#9BBBA0] transition-colors"
                          title="Edit reading"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePoint(pt.id);
                          }}
                          className="p-1 rounded text-[#929B94] hover:text-[#C87975] transition-colors"
                          title="Delete point"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
