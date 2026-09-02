import { describe, it, expect, vi, afterEach } from "vitest";
import { validateImageFile, resizeImage, MAX_RAW_FILE_BYTES } from "./image";

function makeFile(opts: { type?: string; size?: number; name?: string } = {}): File {
  const size = opts.size ?? 1024;
  const content = new Uint8Array(size);
  return new File([content], opts.name ?? "photo.jpg", { type: opts.type ?? "image/jpeg" });
}

describe("validateImageFile", () => {
  it("accepts a jpeg under the size limit", () => {
    expect(validateImageFile(makeFile({ type: "image/jpeg", size: 1024 }))).toBeNull();
  });

  it.each(["image/png", "image/webp"])("accepts %s", (type) => {
    expect(validateImageFile(makeFile({ type }))).toBeNull();
  });

  it("rejects a file over the 5MB raw backstop", () => {
    expect(
      validateImageFile(makeFile({ size: MAX_RAW_FILE_BYTES + 1 })),
    ).toMatch(/too large/);
  });
});

describe("resizeImage", () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    vi.restoreAllMocks();
  });

  function mockCanvasPipeline(bitmap: { width: number; height: number }) {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    const drawImage = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage });
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
    ) {
      callback(new Blob(["fake-jpeg-bytes"], { type: "image/jpeg" }));
    });
    return { drawImage };
  }

  it("re-encodes the result as a JPEG File regardless of the source type", async () => {
    mockCanvasPipeline({ width: 4000, height: 2000 });

    const file = makeFile({ name: "big.png", type: "image/png" });
    const result = await resizeImage(file);

    expect(result.type).toBe("image/jpeg");
    expect(result.name).toBe("big.jpg");
  });

  it("never upscales an image already smaller than 1600px", async () => {
    const { drawImage } = mockCanvasPipeline({ width: 400, height: 300 });

    await resizeImage(makeFile());

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 400, 300);
  });

  it("scales the longest edge down to exactly 1600px, preserving aspect ratio", async () => {
    const { drawImage } = mockCanvasPipeline({ width: 3200, height: 1600 });

    await resizeImage(makeFile());

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 800);
  });
});
