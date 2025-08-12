const express = require("express");
const router = express.Router();
const {ProcessedMessage} = require("../models/ProcessedMessage");

// GET /api/conversations
// returns grouped conversations with last message and last timestamp
router.get("/", async (req, res) => {
  try {
    const rows = await ProcessedMessage.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$wa_id",
          lastMessage: { $first: "$message" }, // message, not text
          lastTimestamp: { $first: "$timestamp" },
          contact_name: { $first: "$contact_name" },
          lastDirection: { $first: "$direction" },
          lastMessageId: { $first: "$id" }, // your schema uses 'id' field
        },
      },
      { $sort: { lastTimestamp: -1 } },
    ]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conversations/:wa_id/messages
router.get("/:wa_id/messages", async (req, res) => {
  const { wa_id } = req.params;
  try {
    const docs = await ProcessedMessage.find({ wa_id })
      .sort({ timestamp: 1 })
      .lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversations/:wa_id/messages  (send message demo)
router.post("/:wa_id/messages", async (req, res) => {
  const { wa_id } = req.params;
  const { text, contact_name } = req.body;
  try {
    const message_id =
      "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const doc = await ProcessedMessage.create({
      wa_id,
      contact_name: contact_name || null,
      message_id,
      from: process.env.BUSINESS_PHONE_ID || "server",
      to: wa_id,
      direction: "outbound",
      text: text || "",
      timestamp: new Date(),
      status: "sent",
      raw: { demo: true },
    });

    const io = req.app.locals.io;
    if (io && wa_id) io.to(wa_id).emit("message:new", doc);

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
