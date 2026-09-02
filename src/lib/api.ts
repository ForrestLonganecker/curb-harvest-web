import type { CreateCropInput } from "./crop-schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface FoodType {
  id: string;
  name: string;
}

export async function fetchFoodTypes(): Promise<FoodType[]> {
  const res = await fetch(`${API_URL}/food-types`);
  if (!res.ok) {
    throw new Error("Failed to load food types");
  }
  return res.json();
}

export interface UploadUrlResult {
  imageId: string;
  uploadUrl: string;
}

export async function requestUploadUrl(contentType: string): Promise<UploadUrlResult> {
  const res = await fetch(`${API_URL}/media/upload-url`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType }),
  });
  if (!res.ok) {
    throw new Error("Failed to get an upload URL");
  }
  return res.json();
}

export async function uploadFile(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error("Failed to upload the photo");
  }
}

export async function confirmUpload(imageId: string): Promise<void> {
  const res = await fetch(`${API_URL}/media/${imageId}/confirm`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to confirm the upload");
  }
}

export async function createCrop(input: CreateCropInput): Promise<void> {
  const res = await fetch(`${API_URL}/crops`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? "Failed to create the crop");
  }
}
