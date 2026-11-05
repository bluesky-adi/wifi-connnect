import React from 'react';
import { Download, Wifi } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'lab' | 'results';
  setActiveTab: (tab: 'overview' | 'lab' | 'results') => void;
  onOpenUtility: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUtility,
  onExportCsv,
}) => {
  return (
    <header className="w-full bg-[#141816] border-b border-[#202622] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-[#F0F1ED] hover:text-[#9BBBA0] transition-colors whitespace-nowrap shrink-0"
        >
          <Wifi className="w-4 h-4 text-[#9BBBA0]" />
          <span>Campus Wi-Fi Mapping</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-6 text-xs font-medium text-[#929B94]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'overview'
                ? 'text-[#F0F1ED] border-[#9BBBA0]'
                : 'border-transparent hover:text-[#F0F1ED]'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lab')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'lab'
                ? 'text-[#F0F1ED] border-[#9BBBA0]'
                : 'border-transparent hover:text-[#F0F1ED]'
            }`}
          >
            Mapping Lab
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'results'
                ? 'text-[#F0F1ED] border-[#9BBBA0]'
                : 'border-transparent hover:text-[#F0F1ED]'
            }`}
          >
            Signal Results
          </button>
          <button
            type="button"
            onClick={onOpenUtility}
            className="text-[#929B94] hover:text-[#9BBBA0] transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent"
          >
            OS Signal Utility
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111412] bg-[#9BBBA0] rounded-lg hover:bg-[#8AA88F] transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
        </div>
      </div>
    </header>
  );
};
