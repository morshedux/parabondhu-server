import { Router } from "express";
import { joinsCollection } from "../db";
import { verifyToken } from "../middleware/auth";

const router = Router();

router.get("/mine", verifyToken, async (req, res) => {
  const joined = await (await joinsCollection())
    .aggregate([
      { $match: { userEmail: req.user!.email } },
      { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
      { $unwind: "$event" },
      { $sort: { "event.eventDate": 1 } },
      { $replaceRoot: { newRoot: { $mergeObjects: ["$event", { joinedAt: "$joinedAt" }] } } },
    ])
    .toArray();
  res.json(joined);
});

export default router;
