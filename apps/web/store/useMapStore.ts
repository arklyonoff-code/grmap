import { create } from "zustand";
import { WaitReport, Zone } from "@grmap/shared/types";

interface MapStore {
  zones: Zone[];
  activeReports: WaitReport[];
  selectedZoneId: string | null;
  isReportFormOpen: boolean;
  setZones: (zones: Zone[]) => void;
  setReports: (reports: WaitReport[]) => void;
  setSelectedZone: (id: string | null) => void;
  openReportForm: () => void;
  closeReportForm: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  zones: [],
  activeReports: [],
  selectedZoneId: null,
  isReportFormOpen: false,
  setZones: (zones) => set({ zones }),
  setReports: (activeReports) => set({ activeReports }),
  setSelectedZone: (selectedZoneId) => set({ selectedZoneId }),
  openReportForm: () => set({ isReportFormOpen: true }),
  closeReportForm: () => set({ isReportFormOpen: false }),
}));
