// apps/web/src/storage/docs-store.ts
// ObrtnIQ v3.0 — Sustav Dokumentacije i Upravljanje Fazama Izgradnje

import { useState, useMemo, useCallback } from 'react';
import {
  OBRTNIQ_PHASES,
  SYSTEM_DOCS_CATALOG,
  type ImplementationPhase,
  type PhaseStatus,
  type SystemDocReference,
  getCompletedPhasesCount,
  getTotalPhasesCount,
  getPhasesProgressPercentage
} from '@obrtniq/core';

export type DocsTabType = 'phases' | 'manifest' | 'catalog';

export interface UseDocsStoreReturn {
  // Stanje
  phases: ImplementationPhase[];
  filteredPhases: ImplementationPhase[];
  docsCatalog: SystemDocReference[];
  selectedPhase: ImplementationPhase | undefined;
  selectedPhaseId: string;
  searchQuery: string;
  statusFilter: PhaseStatus | 'ALL';
  activeTab: DocsTabType;
  
  // Statistika
  totalPhases: number;
  completedPhases: number;
  progressPercentage: number;
  
  // Akcije
  setSelectedPhaseId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: PhaseStatus | 'ALL') => void;
  setActiveTab: (tab: DocsTabType) => void;
  exportPhasesMarkdown: () => string;
}

export function useDocsStore(initialPhaseId: string = 'faza-05'): UseDocsStoreReturn {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(initialPhaseId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<PhaseStatus | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<DocsTabType>('phases');

  // Filtrirane faze na temelju upita za pretragu i filtera statusa
  const filteredPhases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return OBRTNIQ_PHASES.filter(phase => {
      // Status filter
      if (statusFilter !== 'ALL' && phase.status !== statusFilter) {
        return false;
      }
      // Tekstualna pretraga
      if (!q) return true;
      const matchCode = phase.code.toLowerCase().includes(q);
      const matchTitle = phase.title.toLowerCase().includes(q);
      const matchSummary = phase.summary.toLowerCase().includes(q);
      const matchDesc = phase.description.toLowerCase().includes(q);
      const matchTags = phase.tags.some(tag => tag.toLowerCase().includes(q));
      return matchCode || matchTitle || matchSummary || matchDesc || matchTags;
    });
  }, [searchQuery, statusFilter]);

  // Trenutno odabrana faza
  const selectedPhase = useMemo(() => {
    return OBRTNIQ_PHASES.find(p => p.id === selectedPhaseId) || filteredPhases[0] || OBRTNIQ_PHASES[0];
  }, [selectedPhaseId, filteredPhases]);

  // Izvoz sažetka faza u Markdown
  const exportPhasesMarkdown = useCallback((): string => {
    const lines: string[] = [
      '# OBRTNIQ — REGISTAR IMPLEMENTACIJSKIH FAZA I GATE-CHECK VERIFIKACIJA',
      `*Generirano iz lokalnog sustava dokumentacije na dan: ${new Date().toLocaleDateString('hr-HR')}*\n`,
      `Ukupni napredak: ${getCompletedPhasesCount()}/${getTotalPhasesCount()} faza (${getPhasesProgressPercentage()}%)\n`,
      '---\n'
    ];

    OBRTNIQ_PHASES.forEach(phase => {
      const statusIcon = phase.status === 'COMPLETED' ? '✅ GOTOVO' : phase.status === 'IN_PROGRESS' ? '⏳ U TIJEKU' : '📋 PLANIRANO';
      lines.push(`## ${phase.code}: ${phase.title} [${statusIcon}]`);
      if (phase.completedDate) lines.push(`*Dovršeno: ${phase.completedDate}*`);
      lines.push(`\n**Sažetak:** ${phase.summary}\n`);
      lines.push(`**Tehnički opis:** ${phase.description}\n`);
      lines.push('### Gate-Check kriteriji:');
      phase.gateChecks.forEach(gc => {
        lines.push(`- [${gc.passed ? 'x' : ' '}] **${gc.name}**: ${gc.verificationDetail}`);
      });
      if (phase.relatedFiles.length > 0) {
        lines.push('\n**Povezane datoteke:**');
        phase.relatedFiles.forEach(f => lines.push(`- \`${f}\``));
      }
      lines.push('\n---\n');
    });

    return lines.join('\n');
  }, []);

  return {
    phases: OBRTNIQ_PHASES,
    filteredPhases,
    docsCatalog: SYSTEM_DOCS_CATALOG,
    selectedPhase,
    selectedPhaseId,
    searchQuery,
    statusFilter,
    activeTab,
    totalPhases: getTotalPhasesCount(),
    completedPhases: getCompletedPhasesCount(),
    progressPercentage: getPhasesProgressPercentage(),
    setSelectedPhaseId,
    setSearchQuery,
    setStatusFilter,
    setActiveTab,
    exportPhasesMarkdown
  };
}
