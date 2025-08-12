const mongoose = require('mongoose');

const processedMessageSchema = new mongoose.Schema({
  wa_id: String,
  from: String,
  to: String,
  type: String,
  text: String,
  timestamp: Date,
  raw: Object
}, { timestamps: true, collection: 'processed_messages' });

module.exports = mongoose.models.ProcessedMessage || mongoose.model('ProcessedMessage', processedMessageSchema);
