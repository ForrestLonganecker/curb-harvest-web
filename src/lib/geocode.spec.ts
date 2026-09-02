import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geocodeAddress } from "./geocode";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps Mapbox v6 features to latitude/longitude/fullAddress", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({
        features: [
          {
            geometry: { type: "Point", coordinates: [-122.6765, 45.5231] },
            properties: { full_address: "123 Main St, Portland, OR 97201" },
          },
        ],
      }),
    );

    const results = await geocodeAddress("123 Main St", "fake-token");

    expect(results).toEqual([
      { latitude: 45.5231, longitude: -122.6765, fullAddress: "123 Main St, Portland, OR 97201" },
    ]);
  });

  it("sends the query and token as URL params", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ features: [] }));

    await geocodeAddress("456 Oak Ave", "my-token");

    const calledUrl = new URL((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string);
    expect(calledUrl.origin + calledUrl.pathname).toBe(
      "https://api.mapbox.com/search/geocode/v6/forward",
    );
    expect(calledUrl.searchParams.get("q")).toBe("456 Oak Ave");
    expect(calledUrl.searchParams.get("access_token")).toBe("my-token");
  });

  it("throws when the request fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(null, false));

    await expect(geocodeAddress("bad query", "token")).rejects.toThrow(
      "Geocoding request failed",
    );
  });
});
