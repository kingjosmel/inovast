"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface UserCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  selectedCity: string;
  selectedArea: string;
  selectedBranchId: string | null;
  userCoordinates: UserCoordinates | null;
  setSelectedCity: (city: string) => void;
  setSelectedArea: (area: string) => void;
  setSelectedBranchId: (branchId: string | null) => void;
  setUserCoordinates: (coordinates: UserCoordinates | null) => void;
  reset: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedCity: "",
      selectedArea: "",
      selectedBranchId: null,
      userCoordinates: null,
      setSelectedCity: (city: string) => set({ selectedCity: city }),
      setSelectedArea: (area: string) => set({ selectedArea: area }),
      setSelectedBranchId: (branchId: string | null) => set({ selectedBranchId: branchId }),
      setUserCoordinates: (coordinates: UserCoordinates | null) => set({ userCoordinates: coordinates }),
      reset: () =>
        set({
          selectedCity: "",
          selectedArea: "",
          selectedBranchId: null,
          userCoordinates: null,
        }),
    }),
    {
      name: "foodgo-location-store",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
