"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MapPin, Check, ChevronRight, X, Navigation } from "lucide-react";
import { useLocationStore } from "@/store/useLocationStore";

export const NIGERIA_LOCATIONS: Record<
  string,
  { areas: string[]; coordinates: Record<string, { lat: number; lng: number }> }
> = {
  Lagos: {
    areas: [
      "Ikeja",
      "Lekki",
      "Victoria Island",
      "Yaba",
      "Surulere",
      "Ikoyi",
      "Maryland",
      "Ajah",
    ],
    coordinates: {
      Ikeja: { lat: 6.5965, lng: 3.3421 },
      Lekki: { lat: 6.4474, lng: 3.4849 },
      "Victoria Island": { lat: 6.4281, lng: 3.4219 },
      Yaba: { lat: 6.5095, lng: 3.3711 },
      Surulere: { lat: 6.4969, lng: 3.3563 },
      Ikoyi: { lat: 6.4549, lng: 3.4346 },
      Maryland: { lat: 6.5723, lng: 3.3686 },
      Ajah: { lat: 6.4674, lng: 3.5683 },
    },
  },
  Abuja: {
    areas: [
      "Wuse 2",
      "Maitama",
      "Garki",
      "Gwarinpa",
      "Jabi",
      "Utako",
      "Asokoro",
    ],
    coordinates: {
      "Wuse 2": { lat: 9.0765, lng: 7.4721 },
      Maitama: { lat: 9.0882, lng: 7.4988 },
      Garki: { lat: 9.0333, lng: 7.4833 },
      Gwarinpa: { lat: 9.1128, lng: 7.3986 },
      Jabi: { lat: 9.0722, lng: 7.425 },
      Utako: { lat: 9.0628, lng: 7.4417 },
      Asokoro: { lat: 9.0436, lng: 7.5256 },
    },
  },
  "Port Harcourt": {
    areas: [
      "GRA Phase 2",
      "Trans Amadi",
      "Peter Odili Road",
      "Old GRA",
      "Ada George",
    ],
    coordinates: {
      "GRA Phase 2": { lat: 4.8156, lng: 7.0094 },
      "Trans Amadi": { lat: 4.8211, lng: 7.0344 },
      "Peter Odili Road": { lat: 4.805, lng: 7.042 },
      "Old GRA": { lat: 4.7786, lng: 7.0139 },
      "Ada George": { lat: 4.8389, lng: 6.9694 },
    },
  },
  Ibadan: {
    areas: ["Bodija", "Oluyole", "Ring Road", "Jericho", "Samonda"],
    coordinates: {
      Bodija: { lat: 7.4333, lng: 3.9 },
      Oluyole: { lat: 7.3556, lng: 3.8681 },
      "Ring Road": { lat: 7.3711, lng: 3.8767 },
      Jericho: { lat: 7.3917, lng: 3.8694 },
      Samonda: { lat: 7.4444, lng: 3.8944 },
    },
  },
};

interface LocationSelectorModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onLocationSelected?: (city: string, area: string) => void;
  showTrigger?: boolean;
}

function LocationSelectorDialogContent({
  onClose,
  onLocationSelected,
}: {
  onClose: () => void;
  onLocationSelected?: (city: string, area: string) => void;
}) {
  const {
    selectedCity,
    selectedArea,
    setSelectedCity,
    setSelectedArea,
    setUserCoordinates,
  } = useLocationStore();

  const [cityInput, setCityInput] = useState<string>(selectedCity || "Lagos");
  const [areaInput, setAreaInput] = useState<string>(selectedArea || "");
  const [isDetecting, setIsDetecting] = useState(false);

  const availableAreas = NIGERIA_LOCATIONS[cityInput]?.areas || [];

  const handleCityChange = (newCity: string) => {
    setCityInput(newCity);
    const firstArea = NIGERIA_LOCATIONS[newCity]?.areas[0] || "";
    setAreaInput(firstArea);
  };

  const handleSave = () => {
    if (!cityInput || !areaInput) return;

    setSelectedCity(cityInput);
    setSelectedArea(areaInput);

    const coords =
      NIGERIA_LOCATIONS[cityInput]?.coordinates[areaInput] || null;
    if (coords) {
      setUserCoordinates({
        latitude: coords.lat,
        longitude: coords.lng,
      });
    }

    onClose();

    if (onLocationSelected) {
      onLocationSelected(cityInput, areaInput);
    }
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setSelectedCity("Lagos");
        setSelectedArea("Ikeja");
        onClose();
        if (onLocationSelected) {
          onLocationSelected("Lagos", "Ikeja");
        }
      },
      () => {
        setIsDetecting(false);
        setCityInput("Lagos");
        setAreaInput("Ikeja");
      },
      { timeout: 8000 },
    );
  };

  return (
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl focus:outline-none sm:p-7">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <Dialog.Title className="text-lg font-bold text-slate-900">
              Select Delivery Location
            </Dialog.Title>
            <Dialog.Description className="text-xs text-slate-500">
              Find restaurants and fast food nearby
            </Dialog.Description>
          </div>
        </div>
        <Dialog.Close asChild>
          <button
            type="button"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </div>

      <div className="mt-4 space-y-4">
        {/* Auto-detect button */}
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={isDetecting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50/50 py-2.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
        >
          <Navigation className="h-3.5 w-3.5" />
          {isDetecting ? "Detecting location..." : "Use current GPS location"}
        </button>

        {/* City selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Select City
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(NIGERIA_LOCATIONS).map((city) => {
              const isSelected = cityInput === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityChange(city)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    isSelected
                      ? "border-orange-500 bg-orange-500 text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span>{city}</span>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Area selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            2. Select Area / Neighborhood
          </label>
          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {availableAreas.map((area) => {
              const isSelected = areaInput === area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => setAreaInput(area)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isSelected
                      ? "bg-orange-50 text-orange-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{area}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-orange-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!cityInput || !areaInput}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
        >
          <span>Confirm Delivery Location</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </Dialog.Content>
  );
}

export function LocationSelectorModal({
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onLocationSelected,
  showTrigger = false,
}: LocationSelectorModalProps) {
  const { selectedCity, selectedArea } = useLocationStore();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledOpen;
  const setIsOpen = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setUncontrolledOpen;

  // Trigger modal on initial visit if no location is stored
  useEffect(() => {
    if (!selectedCity || !selectedArea) {
      const timer = setTimeout(() => {
        if (!isControlled) {
          setUncontrolledOpen(true);
        } else if (controlledOnOpenChange) {
          controlledOnOpenChange(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedCity, selectedArea, isControlled, controlledOnOpenChange]);

  const locationDisplay =
    selectedCity && selectedArea
      ? `${selectedCity} • ${selectedArea}`
      : selectedCity || "Select Location";

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <Dialog.Trigger asChild>
          <button
            type="button"
            id="location-selector-trigger"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-orange-500 hover:bg-orange-50/40 sm:text-sm"
          >
            <MapPin className="h-4 w-4 text-orange-500" />
            <span>{locationDisplay}</span>
          </button>
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
        <LocationSelectorDialogContent
          onClose={() => setIsOpen(false)}
          onLocationSelected={onLocationSelected}
        />
      </Dialog.Portal>
    </Dialog.Root>
  );
}
