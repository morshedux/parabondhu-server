import { z } from "zod";

export const EVENT_TYPES = [
  "Cleanup",
  "Plantation",
  "Donation",
  "Food Drive",
  "Health Camp",
  "Education",
  "Relief",
] as const;

export const eventSchema = z.object({
  title: z.string().trim().min(5, "Title needs at least 5 characters.").max(100),
  description: z.string().trim().min(20, "Description needs at least 20 characters.").max(2000),
  eventType: z.enum(EVENT_TYPES, { message: "Choose an event type from the list." }),
  thumbnail: z.url({ protocol: /^https?$/, message: "Thumbnail must be a valid image URL." }),
  location: z.string().trim().min(3, "Location needs at least 3 characters.").max(150),
  eventDate: z.coerce
    .date({ message: "Enter a valid event date." })
    .refine((date) => date.getTime() > Date.now(), "Event date must be in the future."),
});
