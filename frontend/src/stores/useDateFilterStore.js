// src/stores/useDateFilterStore.js
import { create } from "zustand";

const toLocalYMD = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toLocaleDateString(
    "en-CA"
  );

// Helper function untuk mendapatkan tanggal default (30 hari terakhir)
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return {
    mode: "days",
    days: 30,
    dateFrom: toLocalYMD(thirtyDaysAgo),
    dateTo: toLocalYMD(today),
  };
};

const useDateFilterStore = create((set) => ({
  dateRange: getDefaultDateRange(), // ✅ Set default value

  setDateRange: (range) => set({ dateRange: range }),

  clearDateRange: () => set({ dateRange: getDefaultDateRange() }), // ✅ Reset ke default, bukan null

  // Helper untuk mendapatkan query params untuk API
  getDateParams: () => {
    const state = useDateFilterStore.getState();
    if (!state.dateRange) return {};

    return {
      dateFrom: state.dateRange.dateFrom,
      dateTo: state.dateRange.dateTo,
    };
  },
}));

export default useDateFilterStore;
