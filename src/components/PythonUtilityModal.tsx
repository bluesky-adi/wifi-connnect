import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Download, FileText, AlertCircle } from 'lucide-react';
import { MeasurementPoint } from '../types/wifi';

interface PythonUtilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPoints: (newPoints: MeasurementPoint[]) => void;
}

const PYTHON_SCRIPT_CODE = `# wifi_collector.py
# Optional Local Wi-Fi Signal Measurement Utility
# Collects connected Wi-Fi network metrics across Windows, macOS, and Linux
# Note: Windows reports Signal Quality as a percentage (e.g. 85%), not verified dBm.

import sys
import subprocess
import re
import json
from datetime import datetime

def get_wifi_metrics():
    platform = sys.platform
    metrics = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "platform": platform,
        "ssid": "Unknown",
        "bssid": "Unknown",
        "signal_metric_type": "unknown",
        "signal_value": None,
        "notes": ""
    }

    try:
        if platform.startswith("win"):
            # Windows netsh command
            output = subprocess.check_output(
                ["netsh", "wlan", "show", "interfaces"],
                encoding="utf-8",
                errors="ignore"
            )
            for line in output.splitlines():
                line = line.strip()
                if line.startswith("SSID") and not line.startswith("BSSID"):
                    metrics["ssid"] = line.split(":", 1)[1].strip()
                elif line.startswith("BSSID"):
                    metrics["bssid"] = line.split(":", 1)[1].strip()
                elif line.startswith("Signal"):
                    match = re.search(r"(\\d+)%", line)
                    if match:
                        metrics["signal_metric_type"] = "quality_percentage"
                        metrics["signal_value"] = int(match.group(1))
                        metrics["notes"] = "Reported as Windows Signal Quality Percentage. For accurate dBm mapping, enter calibrated dBm reading."

        elif platform == "darwin":
            # macOS airport utility
            airport_path = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
            output = subprocess.check_output(
                [airport_path, "-I"],
                encoding="utf-8",
                errors="ignore"
            )
            for line in output.splitlines():
                line = line.strip()
                if line.startswith("SSID:"):
                    metrics["ssid"] = line.split(":", 1)[1].strip()
                elif line.startswith("BSSID:"):
                    metrics["bssid"] = line.split(":", 1)[1].strip()
                elif line.startswith("agrCtlRSSI:"):
                    metrics["signal_metric_type"] = "dbm"
                    metrics["signal_value"] = int(line.split(":", 1)[1].strip())
                    metrics["notes"] = "Native macOS CoreWLAN RSSI in dBm."

        elif platform.startswith("linux"):
            # Linux nmcli command
            output = subprocess.check_output(
                ["nmcli", "-t", "-f", "active,ssid,bssid,signal,bars", "dev", "wifi"],
                encoding="utf-8",
                errors="ignore"
            )
            for line in output.splitlines():
                if line.startswith("yes:"):
                    parts = line.split(":")
                    if len(parts) >= 4:
                        metrics["ssid"] = parts[1]
                        metrics["bssid"] = parts[2]
                        metrics["signal_metric_type"] = "quality_percentage"
                        metrics["signal_value"] = int(parts[3])
                        metrics["notes"] = "Reported via Linux NetworkManager."

    except Exception as e:
        metrics["error"] = str(e)

    return metrics

if __name__ == "__main__":
    print("=" * 60)
    print("CAMPUS WI-FI MAPPING - LOCAL MEASUREMENT HELPER")
    print("=" * 60)
    data = get_wifi_metrics()
    print(json.dumps(data, indent=2))
    print("\\nCopy this reading or paste JSON directly into the web application.")
`;

export const PythonUtilityModal: React.FC<PythonUtilityModalProps> = ({
  isOpen,
  onClose,
  onImportPoints,
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadScript = () => {
    const blob = new Blob([PYTHON_SCRIPT_CODE], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wifi_collector.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    try {
      setImportStatus(null);
      const parsed = JSON.parse(jsonInput);
      const arrayData = Array.isArray(parsed) ? parsed : [parsed];

      const newPoints: MeasurementPoint[] = [];

      for (let i = 0; i < arrayData.length; i++) {
        const item = arrayData[i];
        if (typeof item.rssi === 'number' || typeof item.signal_value === 'number') {
          const rawSignal = item.rssi ?? item.signal_value;
          // Ensure negative dBm
          const validDbm = rawSignal > 0 ? -1 * (100 - rawSignal + 30) : rawSignal;

          newPoints.push({
            id: item.id || `EXT${(i + 1).toString().padStart(2, '0')}`,
            x: typeof item.x === 'number' ? item.x : 450 + (i * 30),
            y: typeof item.y === 'number' ? item.y : 220,
            rssi: validDbm,
            locationLabel: item.locationLabel || item.location || item.ssid || 'External OS Survey',
            roomName: item.roomName || 'Central Corridor',
            timestamp: item.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
            notes: item.notes || 'Imported from local measurement collector',
          });
        }
      }

      if (newPoints.length > 0) {
        onImportPoints(newPoints);
        setImportStatus(`Successfully imported ${newPoints.length} point(s)!`);
        setJsonInput('');
      } else {
        setImportStatus('No valid signal points found in JSON. Expected "rssi" or "signal_value" field.');
      }
    } catch (err: any) {
      setImportStatus(`JSON Parse Error: ${err.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#191E1B] border border-[#28312B] shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#202622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#202622] flex items-center justify-center text-[#9BBBA0]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F0F1ED]">
                Local OS Wi-Fi Measurement Utility
              </h3>
              <p className="text-xs text-[#929B94]">
                Optional Python script for retrieving connected laptop Wi-Fi metrics
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#929B94] hover:text-[#F0F1ED] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operating System Specification Notice */}
        <div className="p-3.5 rounded-lg bg-[#141816] border border-[#202622] text-xs text-[#929B94] space-y-2">
          <div className="flex items-center gap-2 text-[#D6AD72] font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Important OS Measurement Distinction</span>
          </div>
          <p className="leading-relaxed">
            Windows exposes Wi-Fi strength as an <strong className="text-[#F0F1ED]">integer signal quality percentage</strong> (e.g. 85%), not calibrated dBm. macOS CoreWLAN provides native RSSI in dBm directly. For precision campus mapping, you can enter verified dBm readings manually in the Mapping Lab.
          </p>
        </div>

        {/* Python Script Viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#F0F1ED] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#9BBBA0]" />
              wifi_collector.py
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#202622] hover:bg-[#28312B] text-xs text-[#F0F1ED] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
              <button
                type="button"
                onClick={handleDownloadScript}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#202622] hover:bg-[#28312B] text-xs text-[#9BBBA0] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download .py
              </button>
            </div>
          </div>

          <pre className="p-3.5 rounded-lg bg-[#111412] border border-[#202622] font-mono text-[11px] text-[#929B94] overflow-x-auto max-h-56 select-all">
            <code>{PYTHON_SCRIPT_CODE}</code>
          </pre>
        </div>

        {/* Import JSON Section */}
        <div className="pt-2 border-t border-[#202622] space-y-3">
          <label className="block text-xs font-semibold text-[#F0F1ED]">
            Direct Import from Collector / JSON Array
          </label>
          <textarea
            rows={3}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='[{"id": "P10", "x": 520, "y": 210, "rssi": -63, "locationLabel": "Faculty Corridor"}]'
            className="w-full p-2.5 rounded-lg bg-[#141816] border border-[#28312B] font-mono text-xs text-[#F0F1ED] placeholder:text-[#667268] focus:outline-none focus:border-[#9BBBA0]"
          />

          {importStatus && (
            <p className="text-xs font-mono text-[#9BBBA0]">
              {importStatus}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleImportJson}
              disabled={!jsonInput.trim()}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#111412] bg-[#9BBBA0] hover:bg-[#8AA88F] disabled:opacity-50 transition-colors"
            >
              Parse &amp; Import Points
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
