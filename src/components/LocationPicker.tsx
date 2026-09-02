"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { geocodeAddress, type GeocodeResult } from "@/lib/geocode";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const DEFAULT_CENTER: [number, number] = [-122.6765, 45.5231];

export interface Location {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onChange: (location: Location | null) => void;
}

export function LocationPicker({ onChange }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mapUnavailable = !MAPBOX_TOKEN;

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: 9,
    });
    mapRef.current = map;
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  function placePin(latitude: number, longitude: number) {
    // Always report the selection, even in the degraded no-map-token state -
    // address search should still let the form proceed without a visual pin.
    onChangeRef.current({ latitude, longitude });

    const map = mapRef.current;
    if (!map) return;

    if (!markerRef.current) {
      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([longitude, latitude])
        .addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        onChangeRef.current({ latitude: pos.lat, longitude: pos.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
    map.flyTo({ center: [longitude, latitude], zoom: 16 });
  }

  async function handleSearch() {
    setError(null);
    setSuggestions([]);
    if (!address.trim()) return;
    if (!MAPBOX_TOKEN) {
      setError("Address lookup is unavailable (no Mapbox token configured).");
      return;
    }
    try {
      const results = await geocodeAddress(address, MAPBOX_TOKEN);
      if (results.length === 0) {
        setError("No matching address found");
        return;
      }
      setSuggestions(results);
    } catch {
      setError("Could not look up that address");
    }
  }

  function selectSuggestion(result: GeocodeResult) {
    setAddress(result.fullAddress);
    setSuggestions([]);
    placePin(result.latitude, result.longitude);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="address" className="text-sm font-medium">
        Address
      </label>
      <div className="flex gap-2">
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSearch();
            }
          }}
          placeholder="123 Main St, Portland, OR"
          className="flex-1 rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-transparent"
        />
        <button
          type="button"
          onClick={() => void handleSearch()}
          className="rounded border border-black/[.15] px-3 py-2 text-sm dark:border-white/[.2]"
        >
          Search
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {suggestions.length > 0 && (
        <ul className="rounded border border-black/[.08] dark:border-white/[.145]">
          {suggestions.map((suggestion) => (
            <li key={suggestion.fullAddress}>
              <button
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-black/[.04] dark:hover:bg-white/[.08]"
              >
                {suggestion.fullAddress}
              </button>
            </li>
          ))}
        </ul>
      )}
      {mapUnavailable ? (
        <div className="flex h-64 w-full items-center justify-center rounded border border-dashed border-black/[.15] p-4 text-center text-sm text-zinc-500 dark:border-white/[.2]">
          Map unavailable (no Mapbox token configured).
        </div>
      ) : (
        <div ref={mapContainerRef} className="h-64 w-full rounded" />
      )}
      <p className="text-xs text-zinc-500">Drag the pin to fine-tune the exact spot.</p>
    </div>
  );
}
