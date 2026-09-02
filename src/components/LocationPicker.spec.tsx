import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { geocodeAddress } from "@/lib/geocode";

vi.mock("@/lib/geocode", () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock("mapbox-gl", () => {
  class MockMarker {
    private lngLat = { lng: 0, lat: 0 };
    private handlers: Record<string, () => void> = {};
    setLngLat(coords: [number, number]) {
      this.lngLat = { lng: coords[0], lat: coords[1] };
      return this;
    }
    addTo() {
      return this;
    }
    on(event: string, handler: () => void) {
      this.handlers[event] = handler;
      return this;
    }
    getLngLat() {
      return this.lngLat;
    }
  }
  class MockMap {
    remove = vi.fn();
    flyTo = vi.fn();
  }
  return { default: { Map: MockMap, Marker: MockMarker, accessToken: "" } };
});

/**
 * MAPBOX_TOKEN is read from process.env at module-eval time, so exercising both
 * the "token configured" and "no token" paths requires resetting the module
 * registry and re-importing LocationPicker fresh per test. The @/lib/geocode
 * mock instance stays stable across resetModules() (Vitest keeps vi.mock()
 * factories memoized for the file), so the static top-level import of
 * geocodeAddress remains valid throughout - it just needs clearing between tests.
 */
async function loadWithToken(token: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", token);
  const { LocationPicker } = await import("./LocationPicker");
  return LocationPicker;
}

beforeEach(() => {
  vi.mocked(geocodeAddress).mockReset();
});

describe("LocationPicker with a Mapbox token configured", () => {
  it("does not show the map-unavailable message", async () => {
    const LocationPicker = await loadWithToken("test-token");
    render(<LocationPicker onChange={vi.fn()} />);

    expect(
      screen.queryByText("Map unavailable (no Mapbox token configured)."),
    ).not.toBeInTheDocument();
  });

  it("lists suggestions and reports the selected one's coordinates via onChange", async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce([
      { latitude: 45.5231, longitude: -122.6765, fullAddress: "123 Main St, Portland, OR" },
    ]);
    const LocationPicker = await loadWithToken("test-token");
    const onChange = vi.fn();
    render(<LocationPicker onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Address"), "123 Main St");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    const suggestion = await screen.findByRole("button", {
      name: "123 Main St, Portland, OR",
    });
    await userEvent.click(suggestion);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ latitude: 45.5231, longitude: -122.6765 }),
    );
    expect(screen.getByLabelText("Address")).toHaveValue("123 Main St, Portland, OR");
  });

  it("shows an error when the address search returns no results", async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce([]);
    const LocationPicker = await loadWithToken("test-token");
    const onChange = vi.fn();
    render(<LocationPicker onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Address"), "nowhere");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("No matching address found")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows an error when the geocoding request itself fails", async () => {
    vi.mocked(geocodeAddress).mockRejectedValueOnce(new Error("network error"));
    const LocationPicker = await loadWithToken("test-token");
    render(<LocationPicker onChange={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Address"), "123 Main St");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("Could not look up that address")).toBeInTheDocument();
  });
});

describe("LocationPicker with no Mapbox token configured", () => {
  it("shows a map-unavailable placeholder instead of crashing", async () => {
    const LocationPicker = await loadWithToken("");
    render(<LocationPicker onChange={vi.fn()} />);

    expect(
      screen.getByText("Map unavailable (no Mapbox token configured)."),
    ).toBeInTheDocument();
  });

  it("blocks address search with a clear message instead of calling the API", async () => {
    const LocationPicker = await loadWithToken("");
    render(<LocationPicker onChange={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Address"), "123 Main St");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(
      await screen.findByText("Address lookup is unavailable (no Mapbox token configured)."),
    ).toBeInTheDocument();
    expect(geocodeAddress).not.toHaveBeenCalled();
  });
});
