import React, { useState } from 'react';
import {
  BuildingInfo,
  BuildingFloor,
  MeasurementPoint,
  HeatmapSettings,
} from '../types/wifi';
import { FloorPlan } from './FloorPlan';
import { MeasurementTable } from './MeasurementTable';
import { PointModal } from './PointModal';
import { Building, Layers, Plus, Sliders, RefreshCw, AlertCircle } from 'lucide-react';

interface MappingLabSectionProps {
  building: BuildingInfo;
  currentFloor: BuildingFloor;
  floors: BuildingFloor[];
  points: MeasurementPoint[];
  settings: HeatmapSettings;
  selectedFloorId: string;
  onSelectFloor: (floorId: string) => void;
  onSavePoint: (point: MeasurementPoint) => void;
  onDeletePoint: (pointId: string) => void;
  onClearPoints: () => void;
  onLoadSamples: () => void;
  onUpdateSettings: (settings: Partial<HeatmapSettings>) => void;
}

export const MappingLabSection: React.FC<MappingLabSectionProps> = ({
  building,
  currentFloor,
  floors,
  points,
  settings,
  selectedFloorId,
  onSelectFloor,
  onSavePoint,
  onDeletePoint,
  onClearPoints,
  onLoadSamples,
  onUpdateSettings,
}) => {
  // Modal & selection state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialCoords, setModalInitialCoords] = useState<{
    x: number;
    y: number;
    roomName: string;
  } | null>(null);
  const [editingPoint, setEditingPoint] = useState<MeasurementPoint | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Quick manual add point
  const handleOpenAddModalManual = () => {
    setEditingPoint(null);
    setModalInitialCoords({
      x: 500,
      y: 240,
      roomName: 'Main Corridor',
    });
    setIsModalOpen(true);
  };

  // Click on floor plan to add point
  const handleFloorClickAdd = (coords: {
    x: number;
    y: number;
    roomName: string;
  }) => {
    setEditingPoint(null);
    setModalInitialCoords(coords);
    setIsModalOpen(true);
  };

  // Edit point
  const handleEditPoint = (point: MeasurementPoint) => {
    setEditingPoint(point);
    setModalInitialCoords(null);
    setIsModalOpen(true);
  };

  const handleSelectPoint = (point: MeasurementPoint | null) => {
    setSelectedPointId(point ? point.id : null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Top Controls & Selectors Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center justify-between p-4 rounded-xl bg-[#191E1B] border border-[#202622]">
        {/* Building Selector */}
        <div className="md:col-span-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#202622] flex items-center justify-center text-[#9BBBA0] shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[11px] font-mono text-[#929B94] block uppercase">
              Demonstration Building
            </label>
            <div className="flex items-center gap-2">
              <select
                aria-label="Demonstration Building Selector"
                value={building.id}
                disabled
                className="bg-[#141816] border border-[#28312B] text-xs font-semibold text-[#F0F1ED] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-default"
              >
                <option value="vitap-cb">
                  VIT-AP Central Block (Mahatma Gandhi Block)
                </option>
              </select>
              <span className="text-[10px] text-[#9BBBA0] font-mono bg-[#9BBBA0]/10 px-2 py-0.5 rounded border border-[#9BBBA0]/30 whitespace-nowrap">
                Active Demo
              </span>
            </div>
          </div>
        </div>

        {/* Floor Selector */}
        <div className="md:col-span-7 flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-[#929B94] font-medium mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Floor Level:
          </span>
          {floors.map((fl) => {
            const isActive = fl.id === selectedFloorId;
            return (
              <button
                key={fl.id}
                type="button"
                onClick={() => {
                  if (fl.isAvailable) {
                    onSelectFloor(fl.id);
                  }
                }}
                disabled={!fl.isAvailable}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#9BBBA0] text-[#111412] shadow-sm font-semibold'
                    : fl.isAvailable
                    ? 'bg-[#141816] text-[#F0F1ED] hover:bg-[#202622] border border-[#28312B]'
                    : 'bg-[#141816]/50 text-[#667268] border border-transparent cursor-not-allowed opacity-60'
                }`}
                title={
                  fl.isAvailable
                    ? fl.name
                    : `${fl.name} - Future phase (no mock plan)`
                }
              >
                <span>{fl.name}</span>
                {!fl.isAvailable && (
                  <span className="text-[9px] font-mono uppercase bg-[#202622] px-1 py-0.2 rounded text-[#929B94]">
                    Future
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Floor Plan Canvas Card */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#F0F1ED]">
              Interactive Floor Plan &amp; Sensor Grid
            </h2>
            <span className="text-xs text-[#929B94]" aria-hidden="true">·</span>
            <span className="text-xs text-[#929B94]">
              Click anywhere on the schematic to place a measurement point
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddModalManual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#111412] bg-[#9BBBA0] hover:bg-[#8AA88F] transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Measurement
            </button>
          </div>
        </div>

        {/* Schematic SVG Floor Plan with IDW overlay */}
        <FloorPlan
          points={points}
          selectedPointId={selectedPointId}
          settings={settings}
          onSelectPoint={handleSelectPoint}
          onAddPointClick={handleFloorClickAdd}
          onUpdateSettings={onUpdateSettings}
        />
      </div>

      {/* Bottom Parameter Adjustments & Survey Points Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Heatmap Parameter Controls (Left Column 4 Cols) */}
        <div className="lg:col-span-4 rounded-xl bg-[#191E1B] border border-[#202622] p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#202622]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F0F1ED]">
              <Sliders className="w-3.5 h-3.5 text-[#9BBBA0]" />
              <span>IDW Heatmap Parameters</span>
            </div>
            <span className="text-[10px] font-mono text-[#929B94]">
              Formula: Z = Σ(w·Z)/Σw
            </span>
          </div>

          {/* IDW Power Parameter (p) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[#929B94]">
                Power Parameter (<span className="font-mono text-[#F0F1ED]">p</span>)
              </label>
              <span className="font-mono font-semibold text-[#F0F1ED]">
                {settings.power.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.5"
              step="0.1"
              value={settings.power}
              onChange={(e) =>
                onUpdateSettings({ power: parseFloat(e.target.value) })
              }
              className="w-full accent-[#9BBBA0] cursor-pointer"
            />
            <p className="text-[11px] text-[#667268] leading-tight">
              Higher <span className="font-mono">p</span> localizes signal decay; lower <span className="font-mono">p</span> produces broader spatial smoothing.
            </p>
          </div>

          {/* Heatmap Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[#929B94]">Heatmap Layer Opacity</label>
              <span className="font-mono font-semibold text-[#F0F1ED]">
                {Math.round(settings.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.95"
              step="0.05"
              value={settings.opacity}
              onChange={(e) =>
                onUpdateSettings({ opacity: parseFloat(e.target.value) })
              }
              className="w-full accent-[#9BBBA0] cursor-pointer"
            />
          </div>

          {/* Grid Step Resolution */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-[#929B94]">Interpolation Resolution</label>
              <span className="font-mono font-semibold text-[#F0F1ED]">
                {settings.gridResolution === 8 ? 'Ultra' : settings.gridResolution === 12 ? 'Fine' : 'Balanced'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ gridResolution: 16 })}
                className={`py-1 text-xs rounded transition-colors ${
                  settings.gridResolution === 16
                    ? 'bg-[#202622] text-[#F0F1ED] font-medium border border-[#2d3630]'
                    : 'bg-[#141816] text-[#929B94] hover:text-[#F0F1ED]'
                }`}
              >
                Fast
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ gridResolution: 12 })}
                className={`py-1 text-xs rounded transition-colors ${
                  settings.gridResolution === 12
                    ? 'bg-[#202622] text-[#F0F1ED] font-medium border border-[#2d3630]'
                    : 'bg-[#141816] text-[#929B94] hover:text-[#F0F1ED]'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ gridResolution: 8 })}
                className={`py-1 text-xs rounded transition-colors ${
                  settings.gridResolution === 8
                    ? 'bg-[#202622] text-[#F0F1ED] font-medium border border-[#2d3630]'
                    : 'bg-[#141816] text-[#929B94] hover:text-[#F0F1ED]'
                }`}
              >
                Fine
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-[#202622] space-y-2">
            <label className="flex items-center justify-between text-xs text-[#929B94] cursor-pointer">
              <span>Show Room Names</span>
              <input
                type="checkbox"
                checked={settings.showRoomLabels}
                onChange={(e) =>
                  onUpdateSettings({ showRoomLabels: e.target.checked })
                }
                className="accent-[#9BBBA0] rounded"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-[#929B94] cursor-pointer">
              <span>Show Point Beacons</span>
              <input
                type="checkbox"
                checked={settings.showPoints}
                onChange={(e) =>
                  onUpdateSettings({ showPoints: e.target.checked })
                }
                className="accent-[#9BBBA0] rounded"
              />
            </label>
          </div>
        </div>

        {/* Survey Points Table (Right Column 8 Cols) */}
        <div className="lg:col-span-8">
          <MeasurementTable
            points={points}
            selectedPointId={selectedPointId}
            onSelectPoint={(pt) => {
              setSelectedPointId(pt.id);
            }}
            onEditPoint={handleEditPoint}
            onDeletePoint={onDeletePoint}
            onClearAll={onClearPoints}
            onLoadSamples={onLoadSamples}
          />
        </div>
      </div>

      {/* Point Modal (Add / Edit) */}
      <PointModal
        isOpen={isModalOpen}
        initialCoords={modalInitialCoords}
        editingPoint={editingPoint}
        existingPointsCount={points.length}
        onSave={onSavePoint}
        onDelete={onDeletePoint}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPoint(null);
          setModalInitialCoords(null);
        }}
      />
    </div>
  );
};
