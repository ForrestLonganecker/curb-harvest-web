"use client";

import { useEffect, useState } from "react";
import { LocationPicker, type Location } from "@/components/LocationPicker";
import { Button } from "@/components/Button";
import { validateImageFile, resizeImage } from "@/lib/image";
import { createCropSchema, HARVEST_STATUS_VALUES } from "@/lib/crop-schema";
import {
  fetchFoodTypes,
  requestUploadUrl,
  uploadFile,
  confirmUpload,
  createCrop,
  type FoodType,
} from "@/lib/api";

const HARVEST_STATUS_LABELS: Record<(typeof HARVEST_STATUS_VALUES)[number], string> = {
  not_ready: "Not ready yet",
  ready: "Ready to harvest",
  spent: "Spent for the season",
};

export default function NewCropPage() {
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [foodTypeId, setFoodTypeId] = useState("");
  const [variety, setVariety] = useState("");
  const [harvestStatus, setHarvestStatus] =
    useState<(typeof HARVEST_STATUS_VALUES)[number]>("not_ready");
  const [location, setLocation] = useState<Location | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchFoodTypes()
      .then((types) => {
        setFoodTypes(types);
        setFoodTypeId((current) => current || types[0]?.id || "");
      })
      .catch(() => setSubmitError("Failed to load food types"));
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setPhotoError(validationError);
      setPhoto(null);
      return;
    }

    const resized = await resizeImage(file);
    setPhoto(resized);
    setPhotoPreviewUrl(URL.createObjectURL(resized));
  }

  function resetForm() {
    setVariety("");
    setHarvestStatus("not_ready");
    setLocation(null);
    setPhoto(null);
    setPhotoPreviewUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!location) {
      setSubmitError("Pick a location on the map first.");
      return;
    }
    if (!photo) {
      setSubmitError("A photo is required.");
      return;
    }

    const result2 = createCropSchema.omit({ imageId: true }).safeParse({
      latitude: location.latitude,
      longitude: location.longitude,
      foodTypeId,
      variety: variety.trim() || undefined,
      harvestStatus,
    });
    if (!result2.success) {
      setSubmitError(result2.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    console.log(location);
    setSubmitting(true);
    try {
      const { imageId, uploadUrl } = await requestUploadUrl(photo.type);
      await uploadFile(uploadUrl, photo);
      await confirmUpload(imageId);

      await createCrop({ ...result2.data, imageId });

      setSuccess(true);
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Share a crop</h1>

      {success && (
        <div className="flex flex-col gap-3 rounded border border-green-600/30 bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
          <p>Crop created!</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSuccess(false)}
            className="self-start"
          >
            Create another
          </Button>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <LocationPicker onChange={setLocation} />

          <div className="flex flex-col gap-2">
            <label htmlFor="foodType" className="text-sm font-medium">
              Food type
            </label>
            <select
              id="foodType"
              value={foodTypeId}
              onChange={(e) => setFoodTypeId(e.target.value)}
              className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-transparent"
            >
              {foodTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="variety" className="text-sm font-medium">
              Variety <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              id="variety"
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder="e.g. Honeycrisp"
              className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-transparent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="harvestStatus" className="text-sm font-medium">
              Harvest status
            </label>
            <select
              id="harvestStatus"
              value={harvestStatus}
              onChange={(e) =>
                setHarvestStatus(e.target.value as (typeof HARVEST_STATUS_VALUES)[number])
              }
              className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2] dark:bg-transparent"
            >
              {HARVEST_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {HARVEST_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="photo" className="text-sm font-medium">
              Photo
            </label>
            <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
            {photoError && <p className="text-sm text-red-600">{photoError}</p>}
            {photoPreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreviewUrl}
                alt="Selected crop photo preview"
                className="h-40 w-full rounded object-cover"
              />
            )}
          </div>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create crop"}
          </Button>
        </form>
      )}
    </div>
  );
}
