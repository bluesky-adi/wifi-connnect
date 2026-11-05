import React, { useState } from 'react';
import {
  MeasurementPoint,
  HeatmapSettings,
  BuildingInfo,
  BuildingFloor,
} from './types/wifi';
import {
  VIT_AP_CENTRAL_BLOCK,
  INITIAL_SAMPLE_POINTS,
} from './data/floorPlanData';
import { classifySignal } from './utils/heatmap';
import { Header } from './components/Header';
import { OverviewSection } from './components/OverviewSection';
import { MappingLabSection } from './components/MappingLabSection';
import { SignalResultsSection } from './components/SignalResultsSection';
import { PythonUtilityModal } from './components/PythonUtilityModal';
import { PointModal } from './components/PointModal';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'lab' | 'results'>('overview');

  // Building & floor state
  const [building] = useState<BuildingInfo>(VIT_AP_CENTRAL_BLOCK);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('floor-1');

  // Measurement points state
  const [points, setPoints] = useState<MeasurementPoint[]>(INITIAL_SAMPLE_POINTS);

  // Heatmap settings state
  const [settings, setSettings] = useState<HeatmapSettings>({
    power: 2.0,
    gridResolution: 12,
    opacity: 0.65,
    showHeatmap: true,
    showPoints: true,
    showRoomLabels: true,
    showGrid: true,
  });

  // Modal states
  const [isUtilityModalOpen, setIsUtilityModalOpen] = useState(false);
  const [directEditPoint, setDirectEditPoint] = useState<MeasurementPoint | null>(null);

  const currentFloor: BuildingFloor =
    building.floors.find((f) => f.id === selectedFloorId) || building.floors[1];

  const handleUpdateSettings = (newSettings: Partial<HeatmapSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSavePoint = (pointToSave: MeasurementPoint) => {
    setPoints((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === pointToSave.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = pointToSave;
        return updated;
      }
      return [...prev, pointToSave];
    });
  };

  const handleDeletePoint = (pointId: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== pointId));
  };

  const handleClearPoints = () => {
    setPoints([]);
  };

  const handleLoadSamples = () => {
    setPoints(INITIAL_SAMPLE_POINTS);
  };

  const handleImportPoints = (imported: MeasurementPoint[]) => {
    setPoints((prev) => [...prev, ...imported]);
  };

  // CSV Export utility
  const handleExportCsv = () => {
    const headers = [
      'Point ID',
      'Location',
      'Room',
      'Coord X',
      'Coord Y',
      'RSSI (dBm)',
      'Signal Tier',
      'Timestamp',
      'Is Sample',
      'Notes',
    ];

    const rows = points.map((p) => [
      p.id,
      `"${p.locationLabel.replace(/"/g, '""')}"`,
      `"${(p.roomName || '').replace(/"/g, '""')}"`,
      p.x,
      p.y,
      p.rssi,
      classifySignal(p.rssi),
      `"${p.timestamp}"`,
      p.isSample ? 'true' : 'false',
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `vitap_cb_wifi_survey_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#111412] text-[#F0F1ED] flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUtility={() => setIsUtilityModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Main Content Sections */}
      <main className="flex-1 pb-16">
        {activeTab === 'overview' && (
          <OverviewSection
            building={building}
            currentFloor={currentFloor}
            points={points}
            onOpenMappingLab={() => setActiveTab('lab')}
            onOpenSignalResults={() => setActiveTab('results')}
          />
        )}

        {activeTab === 'lab' && (
          <MappingLabSection
            building={building}
            currentFloor={currentFloor}
            floors={building.floors}
            points={points}
            settings={settings}
            selectedFloorId={selectedFloorId}
            onSelectFloor={setSelectedFloorId}
            onSavePoint={handleSavePoint}
            onDeletePoint={handleDeletePoint}
            onClearPoints={handleClearPoints}
            onLoadSamples={handleLoadSamples}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'results' && (
          <SignalResultsSection
            building={building}
            currentFloor={currentFloor}
            points={points}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenLab={() => setActiveTab('lab')}
            onSelectPointForEdit={(point) => {
              setDirectEditPoint(point);
            }}
          />
        )}
      </main>

      {/* Global Quick Edit Modal from Results View */}
      {directEditPoint && (
        <PointModal
          isOpen={Boolean(directEditPoint)}
          editingPoint={directEditPoint}
          existingPointsCount={points.length}
          onSave={handleSavePoint}
          onDelete={handleDeletePoint}
          onClose={() => setDirectEditPoint(null)}
        />
      )}

      {/* Optional Python OS Measurement Modal */}
      <PythonUtilityModal
        isOpen={isUtilityModalOpen}
        onClose={() => setIsUtilityModalOpen(false)}
        onImportPoints={handleImportPoints}
      />

      {/* Subdued Minimal Technical Footer */}
      <footer className="w-full py-4 border-t border-[#202622] bg-[#141816] text-[11px] text-[#929B94]">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#F0F1ED]">VIT-AP University</span>
            <span aria-hidden="true">·</span>
            <span>Mahatma Gandhi Academic Block (Central Block)</span>
          </div>
          <div>
            <span>Demonstration environment for academic Wi-Fi signal mapping research</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
