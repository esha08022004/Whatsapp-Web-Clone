const express = require('express');
const router = express.Router();
const ProcessedMessage = require('../models/ProcessedMessage');
const Payload = require('../models/Payload.js');

function extractValue(payload) {
  if (!payload) return null;
  if (payload.metaData?.entry?.[0]?.changes?.[0]?.value) return payload.metaData.entry[0].changes[0].value;
  if (payload.entry?.[0]?.changes?.[0]?.value) return payload.entry[0].changes[0].value;
  return payload.value || payload;
}

async function handleMessages(value, io) {
  if (!value.messages) return;
  const contacts = value.contacts || [];
  const contact = contacts[0] || {};
  for (const msg of value.messages) {
    const doc = {
      wa_id: contact.wa_id || msg.from || msg.to || null,
      contact_name: contact.profile?.name || null,
      phone_display: value.metadata?.display_phone_number || null,
      conversation_id: value.conversation?.id || null,
      message_id: msg.id || null,
      meta_msg_id: msg.meta_msg_id || null,
      from: msg.from || null,
      to: msg.to || value.metadata?.phone_number_id || null,
      direction: (msg.from && value.metadata?.phone_number_id && msg.from === value.metadata.phone_number_id)
        ? 'outbound'
        : 'inbound',
      text: msg.text?.body || (msg.type === 'text' ? msg.body : null) || null,
      type: msg.type || 'unknown',
      timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000) : new Date(),
      status: 'sent',
      raw: msg
    };

    try {
      if (!doc.message_id) doc.message_id = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);

      const created = await ProcessedMessage.findOneAndUpdate(
        { message_id: doc.message_id },
        { $setOnInsert: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (io && created.wa_id) io.to(created.wa_id).emit('message:new', created);
    } catch (err) {
      if (err.code === 11000) {
        console.warn('duplicate message id', doc.message_id);
      } else {
        console.error('Error inserting message:', err);
      }
    }
  }
}

async function handleStatuses(value, io) {
  if (!value.statuses) return;
  for (const s of value.statuses) {
    const query = { $or: [] };
    if (s.id) query.$or.push({ message_id: s.id });
    if (s.meta_msg_id) query.$or.push({ meta_msg_id: s.meta_msg_id });
    if (query.$or.length === 0) continue;

    const update = { status: s.status || 'unknown' };
    const updated = await ProcessedMessage.findOneAndUpdate(query, update, { new: true });
    if (updated && io && updated.wa_id) {
      io.to(updated.wa_id).emit('message:status', { message_id: updated.message_id, status: updated.status });
    }
  }
}

router.post('/', async (req, res) => {
  const payload = req.body;

  // Save the raw payload before processing
  try {
    await Payload.create({
      wa_id: payload?.entry?.[0]?.id || null,
      from: null,
      to: null,
      type: null,
      text: null,
      timestamp: new Date(),
      raw: payload
    });
    console.log('Raw payload saved to MongoDB');
  } catch (err) {
    console.error('Error saving raw payload:', err);
  }

  const value = extractValue(payload);
  if (!value) return res.status(400).json({ ok: false, message: 'Invalid payload' });

  const io = req.app.locals.io;

  try {
    await handleMessages(value, io);
    await handleStatuses(value, io);
    return res.json({ ok: true });
  } catch (err) {
    console.error('webhook processing error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
