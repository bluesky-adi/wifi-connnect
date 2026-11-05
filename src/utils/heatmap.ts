import {
  MeasurementPoint,
  SignalQualityCategory,
  SignalTierDefinition,
} from '../types/wifi';
import { SIGNAL_TIERS, FLOOR_1_ROOMS } from '../data/floorPlanData';

/**
 * Classifies an RSSI value into a standardized signal tier
 */
export function classifySignal(rssi: number): SignalQualityCategory {
  if (rssi >= -50) return 'strong';
  if (rssi >= -60) return 'good';
  if (rssi >= -70) return 'moderate';
  if (rssi >= -80) return 'weak';
  return 'very_weak';
}

/**
 * Returns the SignalTierDefinition metadata for an RSSI value
 */
export function getSignalTier(rssi: number): SignalTierDefinition {
  const category = classifySignal(rssi);
  return SIGNAL_TIERS.find((t) => t.category === category) || SIGNAL_TIERS[4];
}

/**
 * Performs Inverse Distance Weighting (IDW) interpolation
 *
 * Formula: Z(x) = Σ(wi * Zi) / Σ(wi)
 * where wi = 1 / (di^p)
 *
 * @param x Target X coordinate
 * @param y Target Y coordinate
 * @param points Array of known measurement points
 * @param power Power parameter p (default 2.0)
 * @returns Estimated RSSI value, or null if no points provided
 */
export function interpolateIdw(
  x: number,
  y: number,
  points: MeasurementPoint[],
  power: number = 2.0
): number | null {
  if (!points || points.length === 0) {
    return null;
  }

  // Handle single point edge case
  if (points.length === 1) {
    return points[0].rssi;
  }

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const dx = x - pt.x;
    const dy = y - pt.y;
    const distanceSquared = dx * dx + dy * dy;

    // Handle exact overlap or near-zero distance gracefully without division by zero
    if (distanceSquared < 0.0001) {
      return pt.rssi;
    }

    const distance = Math.sqrt(distanceSquared);
    const weight = 1 / Math.pow(distance, power);

    numerator += weight * pt.rssi;
    denominator += weight;
  }

  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

/**
 * Smoothly maps an estimated RSSI value to RGBA color components
 * Uses calibrated colors matching our scientific theme:
 * Strong:   -30 to -50 dBm  -> Emerald Green (#34D399: 52, 211, 153)
 * Good:     -51 to -60 dBm  -> Lime Green (#84CC16: 132, 204, 22)
 * Moderate: -61 to -70 dBm  -> Calibrated Yellow (#D6AD72: 214, 173, 114)
 * Weak:     -71 to -80 dBm  -> Muted Orange (#E07A5F: 224, 122, 95)
 * Very Weak: below -80 dBm   -> Crimson/Red (#C87975: 200, 121, 117)
 */
export function getRssiColor(
  rssi: number,
  alpha: number = 0.65
): [number, number, number, number] {
  // Clamp realistic bounds for color scaling: -30 to -90 dBm
  const clamped = Math.max(-95, Math.min(-30, rssi));

  // Control anchor stops: [rssi, r, g, b]
  const stops: Array<[number, number, number, number]> = [
    [-30, 52, 211, 153],  // Strong high peak: Emerald
    [-50, 52, 211, 153],  // Strong threshold boundary
    [-60, 132, 204, 22],  // Good threshold boundary: Lime
    [-70, 214, 173, 114], // Moderate boundary: Calibrated amber/gold
    [-80, 224, 122, 95],  // Weak boundary: Muted orange
    [-90, 200, 121, 117], // Very weak boundary: Crimson
    [-95, 175, 80, 80],   // Critical deep dead zone
  ];

  // Find surrounding stops
  let lowerStop = stops[stops.length - 1];
  let upperStop = stops[0];

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    // Since RSSI goes from -30 (s1) down to -95 (s2), s1[0] is greater than s2[0]
    if (clamped <= s1[0] && clamped >= s2[0]) {
      upperStop = s1;
      lowerStop = s2;
      break;
    }
  }

  const range = upperStop[0] - lowerStop[0];
  const t = range === 0 ? 0 : (clamped - lowerStop[0]) / range; // 0 at lowerStop, 1 at upperStop

  const r = Math.round(lowerStop[1] + t * (upperStop[1] - lowerStop[1]));
  const g = Math.round(lowerStop[2] + t * (upperStop[2] - lowerStop[2]));
  const b = Math.round(lowerStop[3] + t * (upperStop[3] - lowerStop[3]));
  const a = Math.round(alpha * 255);

  return [r, g, b, a];
}

/**
 * Checks if a coordinate (x, y) falls inside the building floor boundary
 */
export function isPointInsideBuildingFloor(x: number, y: number): boolean {
  // The building floor plan boundary in 1000 x 560 coordinate space
  // North wing: 35 to 960, 40 to 190
  // Central corridor: 35 to 960, 190 to 280
  // South wing: 35 to 965, 280 to 510
  if (x < 30 || x > 965 || y < 35 || y > 515) {
    return false;
  }
  // Cutouts on bottom left and bottom right corners
  if (x < 95 && y > 450) return false;
  if (x > 900 && y > 480) return false;
  return true;
}

/**
 * Automatically identifies which room a point falls into
 */
export function identifyRoomAt(x: number, y: number): string | null {
  for (const room of FLOOR_1_ROOMS) {
    if (
      x >= room.x &&
      x <= room.x + room.width &&
      y >= room.y &&
      y <= room.y + room.height
    ) {
      return room.name;
    }
  }
  return null;
}

/**
 * Renders the IDW heatmap directly onto an HTML5 Canvas element
 */
export function renderIdwHeatmap(
  canvas: HTMLCanvasElement,
  points: MeasurementPoint[],
  power: number = 2.0,
  stepSize: number = 10,
  opacity: number = 0.65
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear previous render
  ctx.clearRect(0, 0, width, height);

  if (!points || points.length === 0) {
    return;
  }

  // Pre-calculate scaling between coordinate space (1000 x 560) and canvas pixels
  const scaleX = width / 1000;
  const scaleY = height / 560;

  // We can render by iterating over grid cells of size `stepSize`
  const cols = Math.ceil(1000 / stepSize);
  const rows = Math.ceil(560 / stepSize);

  // Use an offscreen canvas or batch draw rects with smoothed alpha
  for (let c = 0; c < cols; c++) {
    const coordX = c * stepSize + stepSize / 2;
    for (let r = 0; r < rows; r++) {
      const coordY = r * stepSize + stepSize / 2;

      // Only compute and draw within the building interior
      if (!isPointInsideBuildingFloor(coordX, coordY)) {
        continue;
      }

      const estimatedRssi = interpolateIdw(coordX, coordY, points, power);
      if (estimatedRssi === null) continue;

      const [red, green, blue, alpha] = getRssiColor(estimatedRssi, opacity);

      ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
      const pixelX = Math.floor(c * stepSize * scaleX);
      const pixelY = Math.floor(r * stepSize * scaleY);
      const cellW = Math.ceil(stepSize * scaleX) + 1; // +1 to eliminate hairline gaps between cells
      const cellH = Math.ceil(stepSize * scaleY) + 1;

      ctx.fillRect(pixelX, pixelY, cellW, cellH);
    }
  }
}
