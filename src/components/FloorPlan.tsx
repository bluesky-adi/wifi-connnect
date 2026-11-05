import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  MeasurementPoint,
  HeatmapSettings,
  RoomDefinition,
} from '../types/wifi';
import { FLOOR_1_ROOMS, SIGNAL_TIERS } from '../data/floorPlanData';
import {
  renderIdwHeatmap,
  identifyRoomAt,
  isPointInsideBuildingFloor,
  classifySignal,
} from '../utils/heatmap';
import { Crosshair, Eye, EyeOff, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface FloorPlanProps {
  points: MeasurementPoint[];
  selectedPointId: string | null;
  settings: HeatmapSettings;
  onSelectPoint: (point: MeasurementPoint | null) => void;
  onAddPointClick: (coords: { x: number; y: number; roomName: string }) => void;
  onUpdateSettings?: (newSettings: Partial<HeatmapSettings>) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({
  points,
  selectedPointId,
  settings,
  onSelectPoint,
  onAddPointClick,
  onUpdateSettings,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCoords, setHoverCoords] = useState<{
    x: number;
    y: number;
    room: string | null;
  } | null>(null);

  // Zoom & Pan state for comfortable floor navigation
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Render heatmap onto the canvas whenever points, power, or resolution changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!settings.showHeatmap || points.length === 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    renderIdwHeatmap(
      canvas,
      points,
      settings.power,
      settings.gridResolution,
      settings.opacity
    );
  }, [points, settings.power, settings.gridResolution, settings.opacity, settings.showHeatmap]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanOffset({
        x: panOffset.x + (e.clientX - dragStart.x),
        y: panOffset.y + (e.clientY - dragStart.y),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert mouse client coordinates to SVG 1000x560 space
    const x = Math.round((clientX / rect.width) * 1000);
    const y = Math.round((clientY / rect.height) * 560);

    const room = identifyRoomAt(x, y);
    setHoverCoords({ x, y, room });
  };

  const handleMouseLeave = () => {
    setHoverCoords(null);
    setIsPanning(false);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // If the click was on a point beacon, it's handled by the point's onClick
    const target = e.target as HTMLElement;
    if (target.closest('.point-beacon')) {
      return;
    }

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const x = Math.round((clientX / rect.width) * 1000);
    const y = Math.round((clientY / rect.height) * 560);

    // Only allow placing inside or close to floor boundaries
    if (isPointInsideBuildingFloor(x, y)) {
      const room = identifyRoomAt(x, y) || 'Corridor / Open Space';
      onAddPointClick({ x, y, roomName: room });
    }
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const selectedPoint = useMemo(
    () => points.find((p) => p.id === selectedPointId) || null,
    [points, selectedPointId]
  );

  return (
    <div className="relative w-full rounded-xl bg-[#191E1B] border border-[#202622] overflow-hidden flex flex-col">
      {/* Top Floor Plan HUD Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#141816] border-b border-[#202622] text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#9BBBA0] font-medium tracking-tight">
            VIT-AP CB // LEVEL 01
          </span>
          <span className="text-[#929B94]" aria-hidden="true">·</span>
          <span className="text-[#929B94]">
            Dimensions: 85m × 48m Schematic
          </span>
          <span className="text-[#929B94]" aria-hidden="true">·</span>
          <span className="font-mono text-[#F0F1ED]">
            {points.length} {points.length === 1 ? 'Reading' : 'Readings'}
          </span>
        </div>

        {/* Viewport & Layer Controls */}
        <div className="flex items-center gap-2">
          {onUpdateSettings && (
            <>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ showHeatmap: !settings.showHeatmap })
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-xs font-medium whitespace-nowrap ${
                  settings.showHeatmap
                    ? 'bg-[#9BBBA0]/20 text-[#9BBBA0] border border-[#9BBBA0]/40'
                    : 'bg-[#202622] text-[#929B94] hover:text-[#F0F1ED]'
                }`}
                title="Toggle IDW Heatmap Layer"
              >
                {settings.showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                Heatmap
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ showPoints: !settings.showPoints })
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-xs font-medium whitespace-nowrap ${
                  settings.showPoints
                    ? 'bg-[#202622] text-[#F0F1ED] border border-[#2d3630]'
                    : 'bg-[#202622] text-[#929B94] hover:text-[#F0F1ED]'
                }`}
                title="Toggle Measurement Points"
              >
                <Layers className="w-3.5 h-3.5" />
                Points ({points.length})
              </button>
            </>
          )}

          <div className="h-4 w-px bg-[#202622]" />

          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
            className="p-1 rounded bg-[#202622] text-[#929B94] hover:text-[#F0F1ED] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
            className="p-1 rounded bg-[#202622] text-[#929B94] hover:text-[#F0F1ED] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-1 rounded bg-[#202622] text-[#929B94] hover:text-[#F0F1ED] transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Floor Plan Stage */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[1000/560] bg-[#111412] overflow-hidden select-none cursor-crosshair"
      >
        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* 1. Underlying Heatmap Canvas */}
          <canvas
            ref={canvasRef}
            width={1000}
            height={560}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ opacity: settings.opacity }}
          />

          {/* 2. Interactive SVG Floor Plan */}
          <svg
            viewBox="0 0 1000 560"
            className="absolute inset-0 w-full h-full z-20"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleSvgClick}
          >
            <defs>
              {/* Architectural Hatch Pattern for Stairs */}
              <pattern
                id="stair-hatch"
                width="8"
                height="8"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#2d3630"
                  strokeWidth="1.5"
                />
              </pattern>

              {/* Grid pattern */}
              <pattern
                id="arch-grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#171C19"
                  strokeWidth="0.75"
                />
              </pattern>
            </defs>

            {/* Architectural Background Grid */}
            <rect width="1000" height="560" fill="url(#arch-grid)" />

            {/* Exterior Building Perimeter Footprint */}
            <path
              d="M 35 40 L 960 40 L 960 480 L 900 480 L 900 510 L 420 510 L 420 480 L 35 480 Z"
              fill="#141816"
              fillOpacity={settings.showHeatmap ? 0.35 : 0.8}
              stroke="#2d3630"
              strokeWidth="2.5"
            />

            {/* Rooms & Corridors */}
            {FLOOR_1_ROOMS.map((room) => {
              const isCorridor = room.type === 'corridor';
              const isStairs = room.type === 'stairs';
              const isLobby = room.type === 'lobby' || room.type === 'entrance';
              const isHighlighted = hoverCoords?.room === room.name;

              return (
                <g key={room.id} className="transition-opacity duration-150">
                  {/* Room Boundary Rect */}
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    fill={
                      isStairs
                        ? 'url(#stair-hatch)'
                        : isCorridor
                        ? '#171C19'
                        : isLobby
                        ? '#1A211D'
                        : '#191E1B'
                    }
                    fillOpacity={settings.showHeatmap ? 0.25 : 0.75}
                    stroke={isHighlighted ? '#9BBBA0' : '#28312B'}
                    strokeWidth={isHighlighted ? 1.5 : 1}
                  />

                  {/* Doors & Openings */}
                  {room.doors?.map((door, dIdx) => (
                    <rect
                      key={dIdx}
                      x={door.x}
                      y={door.y}
                      width={door.width}
                      height={door.height}
                      fill="#111412"
                      stroke="#9BBBA0"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Room Label */}
                  {settings.showRoomLabels && (
                    <g className="pointer-events-none select-none">
                      <text
                        x={room.labelX || room.x + room.width / 2}
                        y={room.labelY || room.y + (room.sublabel ? room.height / 2 - 4 : room.height / 2 + 4)}
                        fill={isHighlighted ? '#F0F1ED' : '#929B94'}
                        fontSize={room.width < 80 ? '9' : '11'}
                        fontWeight="600"
                        letterSpacing="0.02em"
                        textAnchor="middle"
                        className="transition-colors font-sans"
                      >
                        {room.name}
                      </text>
                      {room.sublabel && room.height > 60 && (
                        <text
                          x={room.x + room.width / 2}
                          y={room.y + room.height / 2 + 12}
                          fill="#667268"
                          fontSize="8.5"
                          fontFamily="IBM Plex Mono"
                          textAnchor="middle"
                        >
                          {room.sublabel}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Architectural Entrance Arrow & Portico Label */}
            <g className="pointer-events-none">
              <path
                d="M 505 540 L 505 515 M 497 523 L 505 515 L 513 523"
                fill="none"
                stroke="#9BBBA0"
                strokeWidth="1.5"
              />
              <text
                x="505"
                y="552"
                fill="#9BBBA0"
                fontSize="9"
                fontFamily="IBM Plex Mono"
                textAnchor="middle"
                fontWeight="500"
              >
                PORTICO ENTRY
              </text>
            </g>

            {/* Measurement Points (Beacons) */}
            {settings.showPoints &&
              points.map((pt) => {
                const tier = classifySignal(pt.rssi);
                const tierMeta = SIGNAL_TIERS.find((t) => t.category === tier) || SIGNAL_TIERS[4];
                const isSelected = pt.id === selectedPointId;

                return (
                  <g
                    key={pt.id}
                    className="point-beacon cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPoint(pt);
                    }}
                  >
                    {/* Pulsing/Calibrated Ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 14 : 9}
                      fill={tierMeta.color}
                      fillOpacity={isSelected ? 0.35 : 0.18}
                      stroke={tierMeta.color}
                      strokeWidth={isSelected ? 2 : 1}
                    />

                    {/* Center Core Beacon */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={4}
                      fill={tierMeta.color}
                      stroke="#111412"
                      strokeWidth="1.5"
                    />

                    {/* Point Label Tag */}
                    <g transform={`translate(${pt.x + 8}, ${pt.y - 8})`}>
                      <rect
                        x="0"
                        y="0"
                        width={isSelected ? 62 : 46}
                        height="18"
                        rx="3"
                        fill="#111412"
                        fillOpacity="0.9"
                        stroke={isSelected ? tierMeta.color : '#2d3630'}
                        strokeWidth={isSelected ? 1.5 : 0.75}
                      />
                      <text
                        x="4"
                        y="12"
                        fill="#F0F1ED"
                        fontSize="9.5"
                        fontFamily="IBM Plex Mono"
                        fontWeight="600"
                      >
                        {pt.id}
                      </text>
                      <text
                        x={isSelected ? 26 : 24}
                        y="12"
                        fill={tierMeta.color}
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono"
                      >
                        {pt.rssi}
                      </text>
                    </g>
                  </g>
                );
              })}

            {/* Hover Target Cursor Reticle */}
            {hoverCoords && (
              <g
                transform={`translate(${hoverCoords.x}, ${hoverCoords.y})`}
                className="pointer-events-none opacity-80"
              >
                <circle
                  r="6"
                  fill="none"
                  stroke="#9BBBA0"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <line x1="-10" y1="0" x2="-6" y2="0" stroke="#9BBBA0" strokeWidth="1" />
                <line x1="6" y1="0" x2="10" y2="0" stroke="#9BBBA0" strokeWidth="1" />
                <line x1="0" y1="-10" x2="0" y2="-6" stroke="#9BBBA0" strokeWidth="1" />
                <line x1="0" y1="6" x2="0" y2="10" stroke="#9BBBA0" strokeWidth="1" />
              </g>
            )}
          </svg>
        </div>

        {/* Live Coordinate & Room HUD in Bottom Left */}
        <div className="absolute bottom-2 left-2 z-30 pointer-events-none flex items-center gap-2 px-2.5 py-1 rounded bg-[#111412]/90 border border-[#202622] text-[11px] font-mono text-[#929B94]">
          <Crosshair className="w-3 h-3 text-[#9BBBA0]" />
          {hoverCoords ? (
            <span>
              X: <span className="text-[#F0F1ED]">{hoverCoords.x}</span> · Y:{' '}
              <span className="text-[#F0F1ED]">{hoverCoords.y}</span>
              {hoverCoords.room && (
                <span className="text-[#9BBBA0] ml-2">[{hoverCoords.room}]</span>
              )}
            </span>
          ) : (
            <span>Click map to add survey point</span>
          )}
        </div>

        {/* Selected Point Inspection Bubble */}
        {selectedPoint && (
          <div className="absolute top-2 right-2 z-30 flex flex-col gap-1 p-3 rounded-lg bg-[#141816]/95 border border-[#2d3630] shadow-xl text-xs max-w-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono font-semibold text-[#F0F1ED]">
                {selectedPoint.id}
              </span>
              <span
                className="font-mono px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  backgroundColor: `${SIGNAL_TIERS.find((t) => t.category === classifySignal(selectedPoint.rssi))?.color}20`,
                  color: SIGNAL_TIERS.find((t) => t.category === classifySignal(selectedPoint.rssi))?.color,
                }}
              >
                {selectedPoint.rssi} dBm
              </span>
            </div>
            <div className="text-[#929B94] font-medium">
              {selectedPoint.locationLabel}
            </div>
            {selectedPoint.roomName && (
              <div className="text-[11px] text-[#667268] font-mono">
                Room: {selectedPoint.roomName}
              </div>
            )}
            {selectedPoint.notes && (
              <div className="text-[11px] text-[#929B94] italic mt-0.5">
                "{selectedPoint.notes}"
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#202622]">
              <button
                type="button"
                onClick={() => onSelectPoint(selectedPoint)}
                className="text-[11px] text-[#9BBBA0] hover:underline font-medium"
              >
                Edit Reading
              </button>
              <span className="text-[#202622]">·</span>
              <button
                type="button"
                onClick={() => onSelectPoint(null)}
                className="text-[11px] text-[#929B94] hover:text-[#F0F1ED]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Official Disclaimer Caption */}
      <div className="px-4 py-2 bg-[#141816] border-t border-[#202622] flex items-center justify-between text-[11px] text-[#929B94]">
        <p className="tracking-wide">
          Schematic mock floor plan based on VIT-AP Central Block as a demonstration environment. Not an official architectural blueprint.
        </p>
        <span className="font-mono text-[#667268] hidden md:inline">
          Grid: 1 unit ≈ 0.085m
        </span>
      </div>
    </div>
  );
};
