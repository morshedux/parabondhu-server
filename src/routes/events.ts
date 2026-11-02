import { Router } from "express";
import { Filter, ObjectId } from "mongodb";
import { EventDoc, eventsCollection, joinsCollection } from "../db";
import { verifyToken } from "../middleware/auth";
import { EVENT_TYPES, eventSchema } from "../validation";

const router = Router();

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseId(id: string | string[]) {
  return typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : null;
}

router.get("/", async (req, res) => {
  const { search, type, limit } = req.query;
  const filter: Filter<EventDoc> = { eventDate: { $gte: new Date() } };

  if (typeof search === "string" && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: pattern }, { location: pattern }];
  }
  if (typeof type === "string" && (EVENT_TYPES as readonly string[]).includes(type)) {
    filter.eventType = type;
  }

  const cursor = (await eventsCollection()).find(filter).sort({ eventDate: 1 });
  if (Number(limit) > 0) cursor.limit(Number(limit));
  res.json(await cursor.toArray());
});

router.get("/mine", verifyToken, async (req, res) => {
  const events = await (await eventsCollection())
    .find({ creatorEmail: req.user!.email })
    .sort({ eventDate: 1 })
    .toArray();
  res.json(events);
});

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const event = id && (await (await eventsCollection()).findOne({ _id: id }));
  if (!event) {
    res.status(404).json({ message: "This event does not exist." });
    return;
  }
  const participants = await (await joinsCollection()).countDocuments({ eventId: id });
  res.json({ ...event, participants });
});

router.post("/", verifyToken, async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message });
    return;
  }
  const doc: EventDoc = {
    ...parsed.data,
    creatorEmail: req.user!.email,
    creatorName: req.user!.name,
    createdAt: new Date(),
  };
  const result = await (await eventsCollection()).insertOne(doc);
  res.status(201).json({ ...doc, _id: result.insertedId });
});

router.put("/:id", verifyToken, async (req, res) => {
  const id = parseId(req.params.id);
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message });
    return;
  }
  if (!id) {
    res.status(404).json({ message: "This event does not exist." });
    return;
  }

  const events = await eventsCollection();
  const event = await events.findOne({ _id: id });
  if (!event) {
    res.status(404).json({ message: "This event does not exist." });
    return;
  }
  if (event.creatorEmail !== req.user!.email) {
    res.status(403).json({ message: "You can only update events you created." });
    return;
  }
  await events.updateOne({ _id: id }, { $set: parsed.data });
  res.json({ ...event, ...parsed.data });
});

router.delete("/:id", verifyToken, async (req, res) => {
  const id = parseId(req.params.id);
  const events = await eventsCollection();
  const event = id && (await events.findOne({ _id: id }));
  if (!event) {
    res.status(404).json({ message: "This event does not exist." });
    return;
  }
  if (event.creatorEmail !== req.user!.email) {
    res.status(403).json({ message: "You can only delete events you created." });
    return;
  }
  await events.deleteOne({ _id: id });
  await (await joinsCollection()).deleteMany({ eventId: id });
  res.json({ message: "Event deleted." });
});

router.get("/:id/join-status", verifyToken, async (req, res) => {
  const id = parseId(req.params.id);
  const join =
    id && (await (await joinsCollection()).findOne({ eventId: id, userEmail: req.user!.email }));
  res.json({ joined: Boolean(join) });
});

router.post("/:id/join", verifyToken, async (req, res) => {
  const id = parseId(req.params.id);
  const event = id && (await (await eventsCollection()).findOne({ _id: id }));
  if (!event) {
    res.status(404).json({ message: "This event does not exist." });
    return;
  }
  if (event.eventDate.getTime() <= Date.now()) {
    res.status(400).json({ message: "This event has already taken place." });
    return;
  }

  try {
    await (await joinsCollection()).insertOne({
      eventId: id,
      eventTitle: event.title,
      eventType: event.eventType,
      eventLocation: event.location,
      eventDate: event.eventDate,
      userEmail: req.user!.email,
      userName: req.user!.name,
      joinedAt: new Date(),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      res.status(409).json({ message: "You have already joined this event." });
      return;
    }
    throw error;
  }
  res.status(201).json({ message: "You joined this event." });
});

export default router;
