import React, { useState, useEffect } from 'react';
import { MeasurementPoint } from '../types/wifi';
import { classifySignal } from '../utils/heatmap';
import { SIGNAL_TIERS } from '../data/floorPlanData';
import { X, Trash2, Check, Radio } from 'lucide-react';

interface PointModalProps {
  isOpen: boolean;
  initialCoords?: { x: number; y: number; roomName: string } | null;
  editingPoint?: MeasurementPoint | null;
  existingPointsCount: number;
  onSave: (point: MeasurementPoint) => void;
  onDelete?: (pointId: string) => void;
  onClose: () => void;
}

export const PointModal: React.FC<PointModalProps> = ({
  isOpen,
  initialCoords,
  editingPoint,
  existingPointsCount,
  onSave,
  onDelete,
  onClose,
}) => {
  const isEditing = Boolean(editingPoint);

  const [pointId, setPointId] = useState('');
  const [x, setX] = useState<number>(500);
  const [y, setY] = useState<number>(250);
  const [rssi, setRssi] = useState<number>(-65);
  const [locationLabel, setLocationLabel] = useState('');
  const [roomName, setRoomName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingPoint) {
      setPointId(editingPoint.id);
      setX(editingPoint.x);
      setY(editingPoint.y);
      setRssi(editingPoint.rssi);
      setLocationLabel(editingPoint.locationLabel);
      setRoomName(editingPoint.roomName || '');
      setNotes(editingPoint.notes || '');
    } else if (initialCoords) {
      const nextNum = existingPointsCount + 1;
      const generatedId = `P${nextNum.toString().padStart(2, '0')}`;
      setPointId(generatedId);
      setX(initialCoords.x);
      setY(initialCoords.y);
      setRssi(-65);
      setLocationLabel(initialCoords.roomName);
      setRoomName(initialCoords.roomName);
      setNotes('');
    }
  }, [editingPoint, initialCoords, existingPointsCount, isOpen]);

  if (!isOpen) return null;

  const currentTier = classifySignal(rssi);
  const tierMeta = SIGNAL_TIERS.find((t) => t.category === currentTier) || SIGNAL_TIERS[4];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointId.trim()) return;

    const pointToSave: MeasurementPoint = {
      id: pointId.trim(),
      x,
      y,
      rssi: Number(rssi),
      locationLabel: locationLabel.trim() || roomName || 'Survey Point',
      roomName: roomName.trim() || undefined,
      timestamp: editingPoint?.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
      isSample: false,
      notes: notes.trim() || undefined,
    };

    onSave(pointToSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-[#191E1B] border border-[#28312B] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#202622]">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#9BBBA0]" />
            <h3 className="text-base font-semibold text-[#F0F1ED]">
              {isEditing ? `Edit Measurement ${editingPoint?.id}` : 'Add Wi-Fi Measurement'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#929B94] hover:text-[#F0F1ED] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Row 1: Point ID & Coordinates */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-[#929B94] mb-1">
                Point ID
              </label>
              <input
                type="text"
                required
                value={pointId}
                onChange={(e) => setPointId(e.target.value)}
                placeholder="P01"
                className="w-full px-3 py-1.5 rounded-lg bg-[#141816] border border-[#28312B] text-sm font-mono text-[#F0F1ED] focus:outline-none focus:border-[#9BBBA0]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#929B94] mb-1">
                Coord X
              </label>
              <input
                type="number"
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                min="0"
                max="1000"
                className="w-full px-3 py-1.5 rounded-lg bg-[#141816] border border-[#28312B] text-sm font-mono text-[#929B94] focus:outline-none focus:border-[#9BBBA0]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#929B94] mb-1">
                Coord Y
              </label>
              <input
                type="number"
                value={y}
                onChange={(e) => setY(Number(e.target.value))}
                min="0"
                max="560"
                className="w-full px-3 py-1.5 rounded-lg bg-[#141816] border border-[#28312B] text-sm font-mono text-[#929B94] focus:outline-none focus:border-[#9BBBA0]"
              />
            </div>
          </div>

          {/* Location Description */}
          <div>
            <label className="block text-xs font-medium text-[#929B94] mb-1">
              Location Description
            </label>
            <input
              type="text"
              required
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="e.g. Main entrance, Classroom A rear, Lobby"
              className="w-full px-3 py-2 rounded-lg bg-[#141816] border border-[#28312B] text-sm text-[#F0F1ED] placeholder:text-[#667268] focus:outline-none focus:border-[#9BBBA0]"
            />
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-xs font-medium text-[#929B94] mb-1">
              Associated Room / Area
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Main Corridor, Computer Lab 1"
              className="w-full px-3 py-2 rounded-lg bg-[#141816] border border-[#28312B] text-sm text-[#F0F1ED] placeholder:text-[#667268] focus:outline-none focus:border-[#9BBBA0]"
            />
          </div>

          {/* RSSI Value & Slider */}
          <div className="p-3.5 rounded-lg bg-[#141816] border border-[#28312B] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#929B94]">
                Measured RSSI (Signal Strength)
              </label>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="-100"
                  max="-20"
                  value={rssi}
                  onChange={(e) => setRssi(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 rounded text-right bg-[#191E1B] border border-[#2d3630] text-sm font-semibold text-[#F0F1ED] focus:outline-none focus:border-[#9BBBA0]"
                />
                <span className="text-xs text-[#929B94]">dBm</span>
              </div>
            </div>

            <input
              type="range"
              min="-95"
              max="-30"
              step="1"
              value={rssi}
              onChange={(e) => setRssi(Number(e.target.value))}
              className="w-full accent-[#9BBBA0] cursor-pointer"
            />

            {/* Live Signal Tier Feedback */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#202622]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tierMeta.color }}
                />
                <span className="font-medium text-[#F0F1ED]">
                  {tierMeta.label} Signal
                </span>
                <span className="text-[#929B94]">
                  ({tierMeta.minDbm} to {tierMeta.maxDbm} dBm)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#929B94]">
              {tierMeta.description}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#929B94] mb-1">
              Field Survey Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Near concrete pillar, line-of-sight to corridor AP"
              className="w-full px-3 py-2 rounded-lg bg-[#141816] border border-[#28312B] text-sm text-[#F0F1ED] placeholder:text-[#667268] focus:outline-none focus:border-[#9BBBA0]"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#202622]">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (editingPoint) onDelete(editingPoint.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#C87975] hover:bg-[#C87975]/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Point
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#929B94] hover:text-[#F0F1ED] hover:bg-[#202622] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-[#111412] bg-[#9BBBA0] hover:bg-[#8AA88F] transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {isEditing ? 'Save Changes' : 'Add Point'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
