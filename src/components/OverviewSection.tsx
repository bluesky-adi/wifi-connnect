import React from 'react';
import { MeasurementPoint, BuildingInfo, BuildingFloor } from '../types/wifi';
import { classifySignal } from '../utils/heatmap';
import { ArrowRight, MapPin, Building, Radio, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface OverviewSectionProps {
  building: BuildingInfo;
  currentFloor: BuildingFloor;
  points: MeasurementPoint[];
  onOpenMappingLab: () => void;
  onOpenSignalResults: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  building,
  currentFloor,
  points,
  onOpenMappingLab,
  onOpenSignalResults,
}) => {
  // Compute analytics
  const weakPoints = points.filter((p) => {
    const tier = classifySignal(p.rssi);
    return tier === 'weak' || tier === 'very_weak';
  });

  const strongPoints = points.filter((p) => {
    const tier = classifySignal(p.rssi);
    return tier === 'strong' || tier === 'good';
  });

  const avgRssi =
    points.length > 0
      ? (points.reduce((acc, p) => acc + p.rssi, 0) / points.length).toFixed(1)
      : 'N/A';

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      {/* Hero Overview Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#9BBBA0]">
          <span>CAMPUS WI-FI AUDIT PROTOTYPE</span>
          <span aria-hidden="true">·</span>
          <span>VIT-AP UNIVERSITY</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F0F1ED]">
          Campus Wi-Fi Mapping System
        </h1>
        <p className="text-sm text-[#929B94] leading-relaxed max-w-3xl">
          An empirical indoor signal-strength evaluation system designed to identify
          connectivity dead zones, structural attenuation patterns, and optimal access
          point placement across university academic infrastructure.
        </p>
      </div>

      {/* Building & Target Demonstration Scope Card */}
      <div className="rounded-xl bg-[#191E1B] border border-[#202622] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#202622]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#202622] flex items-center justify-center text-[#9BBBA0]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-[#929B94]">Selected Academic Facility</div>
              <h2 className="text-lg font-semibold text-[#F0F1ED]">
                {building.officialName}
              </h2>
              <div className="text-xs text-[#929B94] flex items-center gap-2 mt-0.5">
                <span>{building.name}</span>
                <span aria-hidden="true">·</span>
                <span>{building.institution}, {building.campus}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#929B94] block">Demonstration Level</span>
            <span className="text-sm font-semibold font-mono text-[#9BBBA0]">
              {currentFloor.name}
            </span>
          </div>
        </div>

        {/* 4 Quantitative Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-[#141816] border border-[#202622]">
            <div className="flex items-center justify-between text-xs text-[#929B94] mb-1">
              <span>Survey Points</span>
              <Radio className="w-3.5 h-3.5 text-[#9BBBA0]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#F0F1ED] tabular-nums">
              {points.length}
            </div>
            <div className="text-[11px] text-[#929B94] mt-1">
              Active spatial coordinates
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#141816] border border-[#202622]">
            <div className="flex items-center justify-between text-xs text-[#929B94] mb-1">
              <span>Weak Coverage</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#C87975]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#C87975] tabular-nums">
              {weakPoints.length}
            </div>
            <div className="text-[11px] text-[#929B94] mt-1">
              Locations &lt; -70 dBm
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#141816] border border-[#202622]">
            <div className="flex items-center justify-between text-xs text-[#929B94] mb-1">
              <span>Strong Signals</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#34D399] tabular-nums">
              {strongPoints.length}
            </div>
            <div className="text-[11px] text-[#929B94] mt-1">
              Locations &ge; -60 dBm
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#141816] border border-[#202622]">
            <div className="flex items-center justify-between text-xs text-[#929B94] mb-1">
              <span>Mean Signal</span>
              <span className="text-xs font-mono text-[#929B94]">dBm</span>
            </div>
            <div className="text-2xl font-bold font-mono text-[#F0F1ED] tabular-nums">
              {avgRssi}
            </div>
            <div className="text-[11px] text-[#929B94] mt-1">
              Floor-wide arithmetic avg
            </div>
          </div>
        </div>

        {/* Primary Call to Action */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#929B94] max-w-xl">
            Inspect the interactive schematic floor plan, record real-time RSSI readings at specific classroom or lab coordinates, and compute the Inverse Distance Weighting heatmap.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSignalResults}
              className="px-4 py-2 text-xs font-medium text-[#929B94] hover:text-[#F0F1ED] bg-[#202622] hover:bg-[#28312B] rounded-lg transition-colors whitespace-nowrap"
            >
              View Heatmap Results
            </button>
            <button
              type="button"
              onClick={onOpenMappingLab}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#111412] bg-[#9BBBA0] hover:bg-[#8AA88F] rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <span>Open Mapping Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Project Methodology & Academic Framework */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-[#191E1B] border border-[#202622] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#F0F1ED] flex items-center gap-2">
            <span>Workflow & Signal Assessment</span>
          </h3>
          <ol className="text-xs text-[#929B94] space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              <strong className="text-[#F0F1ED]">Spatial Sampling:</strong> Measure Wi-Fi RSSI (Received Signal Strength Indicator) at calibrated grid points across corridors, classrooms, and labs.
            </li>
            <li>
              <strong className="text-[#F0F1ED]">Mathematical Interpolation:</strong> Execute Inverse Distance Weighting (IDW) algorithms to predict continuous signal fields between physical sample points.
            </li>
            <li>
              <strong className="text-[#F0F1ED]">Dead Zone Mitigation:</strong> Pinpoint localized RF attenuation caused by reinforced concrete walls, stairwells, and equipment racks.
            </li>
          </ol>
        </div>

        <div className="rounded-xl bg-[#191E1B] border border-[#202622] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#F0F1ED] flex items-center gap-2">
            <span>Engineering Ground Rules</span>
          </h3>
          <ul className="text-xs text-[#929B94] space-y-2 list-disc list-inside leading-relaxed">
            <li>
              <span className="text-[#F0F1ED]">Demonstration Environment:</span> Floor plan is a clean schematic diagram inspired by VIT-AP Central Block architecture.
            </li>
            <li>
              <span className="text-[#F0F1ED]">Pure Physics Model:</span> Uses true negative dBm scales where values closer to 0 represent superior signal fidelity.
            </li>
            <li>
              <span className="text-[#F0F1ED]">No Synthetic Hallucinations:</span> Simulated demonstration points are visibly labeled; users may enter exact field readings at any time.
            </li>
          </ul>
        </div>
      </div>

      {/* Official Prototype Disclaimer Note */}
      <div className="p-4 rounded-xl bg-[#141816] border border-[#202622] flex items-start gap-3 text-xs text-[#929B94]">
        <Info className="w-4 h-4 text-[#9BBBA0] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#F0F1ED]">Demonstration Notice:</strong> Schematic mock floor plan based on VIT-AP Central Block as a demonstration environment. Not an official architectural blueprint. Do not claim simulated readings are actual field measurements.
        </p>
      </div>
    </div>
  );
};
