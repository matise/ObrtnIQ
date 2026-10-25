import React from 'react';
import type { UseZigoAgentReturn } from '../hooks/useZigoAgent';
import type { UseLiveScreenContextReturn } from '../hooks/useLiveScreenContext';
import { ZigoCopilotPanel } from './ZigoCopilotPanel';

export interface ZigoChatDrawerProps {
  agent: UseZigoAgentReturn;
  liveContext: UseLiveScreenContextReturn;
}

export const ZigoChatDrawer: React.FC<ZigoChatDrawerProps> = ({ agent, liveContext }) => {
  if (!agent.isDrawerOpen || agent.isDocked) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none print:hidden flex justify-end">
      {/* 1. Zatamnjena pozadina s klikom za zatvaranje */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => agent.setIsDrawerOpen(false)}
      />

      {/* 2. Glavni panel ladice */}
      <div className="relative w-full sm:w-[500px] md:w-[580px] lg:w-[640px] h-full z-10 shadow-2xl flex flex-col">
        <ZigoCopilotPanel
          agent={agent}
          liveContext={liveContext}
          isDocked={agent.isDocked}
          onToggleDock={() => {
            agent.setIsDrawerOpen(false);
            agent.setIsDocked(true);
          }}
          onClose={() => agent.setIsDrawerOpen(false)}
        />
      </div>
    </div>
  );
};
