import { z } from "zod";

export const HARVEST_STATUS_VALUES = ["not_ready", "ready", "spent"] as const;

export const createCropSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  foodTypeId: z.string().uuid(),
  imageId: z.string().uuid(),
  variety: z.string().trim().min(1).max(200).optional(),
  harvestStatus: z.enum(HARVEST_STATUS_VALUES).default("not_ready"),
});

export type CreateCropInput = z.infer<typeof createCropSchema>;
