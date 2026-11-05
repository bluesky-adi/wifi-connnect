/**
 * Type definitions for the Campus Wi-Fi Mapping System
 * Focused on VIT-AP Central Block Demonstration
 */

export type SignalQualityCategory = 'strong' | 'good' | 'moderate' | 'weak' | 'very_weak';

export interface SignalTierDefinition {
  category: SignalQualityCategory;
  label: string;
  minDbm: number;
  maxDbm: number;
  color: string;
  textColor: string;
  description: string;
}

export interface MeasurementPoint {
  id: string;
  x: number; // 0 to 1000 coordinate space
  y: number; // 0 to 560 coordinate space
  rssi: number; // dBm value, e.g. -42
  locationLabel: string;
  roomName?: string;
  timestamp: string;
  isSample?: boolean;
  notes?: string;
}

export interface RoomDefinition {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'library' | 'study' | 'corridor' | 'lobby' | 'stairs' | 'restroom' | 'admin' | 'entrance';
  x: number;
  y: number;
  width: number;
  height: number;
  labelX?: number;
  labelY?: number;
  sublabel?: string;
  doors?: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface BuildingFloor {
  id: string;
  name: string;
  levelNumber: number;
  isAvailable: boolean;
  description: string;
  dimensionsMeters: { width: number; height: number };
}

export interface BuildingInfo {
  id: string;
  name: string;
  officialName: string;
  code: string;
  campus: string;
  institution: string;
  floors: BuildingFloor[];
}

export interface HeatmapSettings {
  power: number; // IDW power parameter p (typically 2.0)
  gridResolution: number; // Step size in coordinate pixels (e.g., 10px)
  opacity: number; // 0.1 to 1.0
  showHeatmap: boolean;
  showPoints: boolean;
  showRoomLabels: boolean;
  showGrid: boolean;
}

export interface WeakAreaInsight {
  pointId?: string;
  zoneName: string;
  observedRssi: number;
  classification: SignalQualityCategory;
  severity: 'critical' | 'moderate';
  primaryFactor: string;
  recommendation: string;
}
