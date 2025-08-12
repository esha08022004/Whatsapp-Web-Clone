const mongoose = require("mongoose");

const processedMessageSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  message: String,
  timestamp: Date,
  wa_id: String,
  from: String,
  to: String,
  contact_name: String,   
  direction: String, 
  status: {
    type: String,
    enum: ["pending", "sent", "delivered", "read"],
    default: "pending",
  },
});


const ProcessedMessage = mongoose.model("ProcessedMessage", processedMessageSchema);

module.exports = { ProcessedMessage };
