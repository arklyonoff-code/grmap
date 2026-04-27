import { create } from 'zustand';
import { WaitReport, Zone, ZoneWithStatus } from '@grmap/shared/types';

interface AppState {
  zones: Zone[];
  activeReports: WaitReport[];
  selectedZone: ZoneWithStatus | null;
  isWaitModalVisible: boolean;
  waitModalZoneId?: string;
  setZones: (zones: Zone[]) => void;
  setActiveReports: (reports: WaitReport[]) => void;
  setSelectedZone: (zone: ZoneWithStatus | null) => void;
  openWaitModal: (zoneId?: string) => void;
  closeWaitModal: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  zones: [],
  activeReports: [],
  selectedZone: null,
  isWaitModalVisible: false,
  waitModalZoneId: undefined,
  setZones: (zones) => set({ zones }),
  setActiveReports: (activeReports) => set({ activeReports }),
  setSelectedZone: (selectedZone) => set({ selectedZone }),
  openWaitModal: (zoneId) => set({ isWaitModalVisible: true, waitModalZoneId: zoneId }),
  closeWaitModal: () => set({ isWaitModalVisible: false, waitModalZoneId: undefined }),
}));
