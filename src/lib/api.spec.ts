import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchFoodTypes,
  requestUploadUrl,
  uploadFile,
  confirmUpload,
  createCrop,
} from "./api";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchFoodTypes", () => {
    it("returns the parsed list", async () => {
      const list = [{ id: "1", name: "Apple" }];
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(list));

      await expect(fetchFoodTypes()).resolves.toEqual(list);
    });

    it("throws on a non-ok response", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(null, false));

      await expect(fetchFoodTypes()).rejects.toThrow("Failed to load food types");
    });
  });

  describe("requestUploadUrl", () => {
    it("posts the content type and returns imageId/uploadUrl", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        jsonResponse({ imageId: "img-1", uploadUrl: "https://minio.local/put" }),
      );

      const result = await requestUploadUrl("image/jpeg");

      expect(result).toEqual({ imageId: "img-1", uploadUrl: "https://minio.local/put" });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/media/upload-url"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ contentType: "image/jpeg" }),
        }),
      );
    });
  });

  describe("uploadFile", () => {
    it("PUTs the file to the presigned URL with its content type", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({}));
      const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

      await uploadFile("https://minio.local/put", file);

      expect(fetch).toHaveBeenCalledWith("https://minio.local/put", {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: file,
      });
    });

    it("throws when the upload fails", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(null, false));
      const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

      await expect(uploadFile("https://minio.local/put", file)).rejects.toThrow(
        "Failed to upload the photo",
      );
    });
  });

  describe("confirmUpload", () => {
    it("posts to the confirm endpoint", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({}));

      await confirmUpload("img-1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/media/img-1/confirm"),
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
    });
  });

  describe("createCrop", () => {
    const input = {
      latitude: 45.5,
      longitude: -122.6,
      foodTypeId: "food-1",
      imageId: "img-1",
      harvestStatus: "not_ready" as const,
    };

    it("posts the crop payload", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({}));

      await createCrop(input);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/crops"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify(input),
        }),
      );
    });

    it("surfaces the API's error message on failure", async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        jsonResponse({ message: "Unknown food type" }, false),
      );

      await expect(createCrop(input)).rejects.toThrow("Unknown food type");
    });
  });
});
