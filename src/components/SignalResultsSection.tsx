import React, { useMemo, useState } from 'react';
import {
  MeasurementPoint,
  HeatmapSettings,
  BuildingInfo,
  BuildingFloor,
  WeakAreaInsight,
} from '../types/wifi';
import { FloorPlan } from './FloorPlan';
import { SIGNAL_TIERS } from '../data/floorPlanData';
import { classifySignal, getSignalTier } from '../utils/heatmap';
import {
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Download,
  Info,
  Radio,
  WifiOff,
  Maximize2,
} from 'lucide-react';

interface SignalResultsSectionProps {
  building: BuildingInfo;
  currentFloor: BuildingFloor;
  points: MeasurementPoint[];
  settings: HeatmapSettings;
  onUpdateSettings: (settings: Partial<HeatmapSettings>) => void;
  onOpenLab: () => void;
  onSelectPointForEdit: (point: MeasurementPoint) => void;
}

export const SignalResultsSection: React.FC<SignalResultsSectionProps> = ({
  building,
  currentFloor,
  points,
  settings,
  onUpdateSettings,
  onOpenLab,
  onSelectPointForEdit,
}) => {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Compute Signal distribution breakdown
  const distribution = useMemo(() => {
    if (points.length === 0) {
      return { strong: 0, good: 0, moderate: 0, weak: 0, very_weak: 0, total: 0 };
    }
    const counts = { strong: 0, good: 0, moderate: 0, weak: 0, very_weak: 0, total: points.length };
    for (const p of points) {
      const tier = classifySignal(p.rssi);
      counts[tier] = (counts[tier] || 0) + 1;
    }
    return counts;
  }, [points]);

  // Compute weak coverage insights
  const weakAreas: WeakAreaInsight[] = useMemo(() => {
    const list: WeakAreaInsight[] = [];

    // Find points with weak/critical signal
    for (const p of points) {
      const tier = classifySignal(p.rssi);
      if (tier === 'very_weak') {
        list.push({
          pointId: p.id,
          zoneName: p.locationLabel || p.roomName || 'Unknown Area',
          observedRssi: p.rssi,
          classification: 'very_weak',
          severity: 'critical',
          primaryFactor: 'Severe wall/pillar attenuation or excessive path loss from central corridor AP.',
          recommendation: 'Deploy secondary 5GHz Access Point or dedicated Wi-Fi extender in this zone.',
        });
      } else if (tier === 'weak') {
        list.push({
          pointId: p.id,
          zoneName: p.locationLabel || p.roomName || 'Unknown Area',
          observedRssi: p.rssi,
          classification: 'weak',
          severity: 'moderate',
          primaryFactor: 'RF path obstruction through reinforced concrete masonry wall.',
          recommendation: 'Optimize existing corridor AP azimuth or lower channel power threshold.',
        });
      }
    }

    return list;
  }, [points]);

  // Statistical summary
  const stats = useMemo(() => {
    if (points.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }
    const rssis = points.map((p) => p.rssi);
    const min = Math.min(...rssis);
    const max = Math.max(...rssis);
    const sum = rssis.reduce((a, b) => a + b, 0);
    return {
      min,
      max,
      avg: parseFloat((sum / points.length).toFixed(1)),
      count: points.length,
    };
  }, [points]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#202622]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9BBBA0]">
            <span>VIT-AP CENTRAL BLOCK</span>
            <span aria-hidden="true">·</span>
            <span>LEVEL 01 ANALYSIS</span>
          </div>
          <h2 className="text-xl font-bold text-[#F0F1ED] mt-0.5">
            Signal Coverage Results &amp; Heatmap
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLab}
            className="px-3 py-1.5 text-xs font-medium text-[#F0F1ED] bg-[#202622] hover:bg-[#28312B] rounded-lg transition-colors"
          >
            Adjust Survey Points in Lab
          </button>
        </div>
      </div>

      {/* Main Heatmap Stage with Integrated Floor Plan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#929B94]">
          <span>
            Interpolated RSSI Heatmap (Inverse Distance Weighting, Power p = {settings.power.toFixed(1)})
          </span>
          <span className="font-mono text-[11px]">
            {points.length} Calibration Nodes
          </span>
        </div>

        <FloorPlan
          points={points}
          selectedPointId={selectedPointId}
          settings={{ ...settings, showHeatmap: true }}
          onSelectPoint={(pt) => {
            setSelectedPointId(pt ? pt.id : null);
            if (pt) onSelectPointForEdit(pt);
          }}
          onAddPointClick={() => onOpenLab()}
          onUpdateSettings={onUpdateSettings}
        />
      </div>

      {/* Standardized Scientific Color Legend */}
      <div className="p-4 rounded-xl bg-[#191E1B] border border-[#202622] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#F0F1ED]">
            Signal Strength Classification Legend (Documented Thresholds)
          </span>
          <span className="text-[11px] font-mono text-[#929B94]">
            Closer to 0 dBm = Stronger
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {SIGNAL_TIERS.map((tier) => {
            const count =
              tier.category === 'strong'
                ? distribution.strong
                : tier.category === 'good'
                ? distribution.good
                : tier.category === 'moderate'
                ? distribution.moderate
                : tier.category === 'weak'
                ? distribution.weak
                : distribution.very_weak;

            const percentage =
              distribution.total > 0
                ? Math.round((count / distribution.total) * 100)
                : 0;

            return (
              <div
                key={tier.category}
                className="p-3 rounded-lg bg-[#141816] border border-[#202622] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-xs font-semibold text-[#F0F1ED]">
                      {tier.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#929B94]">
                    {count} pts ({percentage}%)
                  </span>
                </div>

                <div className="text-[11px] font-mono" style={{ color: tier.color }}>
                  {tier.minDbm} to {tier.maxDbm} dBm
                </div>

                <p className="text-[10.5px] text-[#929B94] leading-tight line-clamp-2">
                  {tier.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diagnostic Analytics & Weak Coverage Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Identified Weak Signal Zones List (8 cols) */}
        <div className="lg:col-span-8 rounded-xl bg-[#191E1B] border border-[#202622] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#202622]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C87975]" />
              <h3 className="text-sm font-semibold text-[#F0F1ED]">
                Identified Weak Coverage Locations
              </h3>
            </div>
            <span className="text-xs font-mono text-[#C87975]">
              {weakAreas.length} {weakAreas.length === 1 ? 'Area Flagged' : 'Areas Flagged'}
            </span>
          </div>

          {weakAreas.length === 0 ? (
            <div className="py-8 text-center text-[#929B94] text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#34D399] mx-auto opacity-80" />
              <p className="text-[#F0F1ED] font-medium">
                No weak coverage zones detected
              </p>
              <p className="text-[11px] max-w-md mx-auto">
                All measured locations in VIT-AP Central Block Level 1 meet or exceed the -70 dBm academic connectivity baseline.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {weakAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-[#141816] border border-[#28312B] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#F0F1ED]">
                        {area.pointId}
                      </span>
                      <span className="text-[#929B94]" aria-hidden="true">·</span>
                      <span className="font-semibold text-[#F0F1ED]">
                        {area.zoneName}
                      </span>
                      <span
                        className="font-mono px-1.5 py-0.2 rounded text-[10.5px]"
                        style={{
                          backgroundColor:
                            area.classification === 'very_weak'
                              ? '#C8797520'
                              : '#E07A5F20',
                          color:
                            area.classification === 'very_weak'
                              ? '#C87975'
                              : '#E07A5F',
                        }}
                      >
                        {area.observedRssi} dBm
                      </span>
                    </div>
                    <p className="text-[#929B94] text-[11.5px]">
                      <span className="text-[#667268]">Factor:</span> {area.primaryFactor}
                    </p>
                    <p className="text-[#9BBBA0] text-[11px] font-medium">
                      <span className="text-[#667268]">Action:</span> {area.recommendation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const pt = points.find((p) => p.id === area.pointId);
                      if (pt) onSelectPointForEdit(pt);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded bg-[#202622] text-[#929B94] hover:text-[#F0F1ED] transition-colors whitespace-nowrap shrink-0 self-end md:self-center"
                  >
                    Inspect Point
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistical Summary Panel (4 cols) */}
        <div className="lg:col-span-4 rounded-xl bg-[#191E1B] border border-[#202622] p-5 space-y-4">
          <div className="pb-3 border-b border-[#202622] text-xs font-semibold text-[#F0F1ED]">
            Signal Metrics &amp; Bounds
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#202622]">
              <span className="text-[#929B94]">Maximum Signal Peak</span>
              <span className="font-mono font-semibold text-[#34D399] tabular-nums">
                {stats.max} dBm
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#202622]">
              <span className="text-[#929B94]">Minimum Signal Floor</span>
              <span className="font-mono font-semibold text-[#C87975] tabular-nums">
                {stats.min} dBm
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#202622]">
              <span className="text-[#929B94]">Arithmetic Average</span>
              <span className="font-mono font-semibold text-[#F0F1ED] tabular-nums">
                {stats.avg} dBm
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#202622]">
              <span className="text-[#929B94]">Strong / Good Ratio</span>
              <span className="font-mono text-[#F0F1ED] tabular-nums">
                {stats.count > 0
                  ? Math.round(
                      ((distribution.strong + distribution.good) / stats.count) * 100
                    )
                  : 0}
                %
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[#929B94]">Weak Coverage Area Ratio</span>
              <span className="font-mono text-[#E07A5F] tabular-nums">
                {stats.count > 0
                  ? Math.round(
                      ((distribution.weak + distribution.very_weak) / stats.count) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Academic Recommendation Box */}
          <div className="p-3 rounded-lg bg-[#141816] border border-[#202622] text-[11px] text-[#929B94] space-y-1">
            <div className="font-semibold text-[#F0F1ED]">
              University Presentation Note
            </div>
            <p className="leading-relaxed">
              When demonstrating this model, highlight how Inverse Distance Weighting interpolates smooth signal gradients across the central corridor and into the classrooms, accurately modeling signal loss across interior partitions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
