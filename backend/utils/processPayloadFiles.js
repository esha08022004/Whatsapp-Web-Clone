const fs = require("fs");
const path = require("path");
const {ProcessedMessage} = require("../models/ProcessedMessage");

// Pass folder path as argument or environment variable
const processPayloadFiles = async (dir) => {
  if (!dir) {
    throw new Error("Please provide payload folder path");
  }

  const absoluteDir = path.resolve(dir);
  const files = fs.readdirSync(absoluteDir);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const filePath = path.join(absoluteDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      const changes = content?.metaData?.entry?.[0]?.changes?.[0];
      if (!changes) {
        console.warn(`No changes found in file ${file}`);
        continue;
      }

      const value = changes.value;

      if (value.messages && value.messages.length) {
        for (const msg of value.messages) {
          const timestampSec = Number(msg.timestamp);
          const timestamp = new Date(timestampSec * 1000);
          if (isNaN(timestamp.getTime())) {
            console.warn(`Invalid timestamp in file ${file}: ${msg.timestamp}`);
            continue;
          }

          await ProcessedMessage.findOneAndUpdate(
            { id: msg.id },
            {
              id: msg.id,
              message: msg.text?.body || "",
              timestamp,
              wa_id: value.contacts?.[0]?.wa_id || null,
              from: msg.from || null,
              to: null,
              status: "pending",
              contact_name: value.contacts?.[0]?.profile?.name || null,
              direction: "inbound",
            },
            { upsert: true, new: true }
          );
          console.log(`Saved/updated message ${msg.id} from file: ${file}`);
        }
      } else if (value.statuses && value.statuses.length) {
        for (const statusUpdate of value.statuses) {
          const msgId = statusUpdate.id || statusUpdate.meta_msg_id;
          if (!msgId) continue;

          const status = statusUpdate.status;
          await ProcessedMessage.findOneAndUpdate(
            { id: msgId },
            { status },
            { new: true }
          );
          console.log(`Updated status for message ${msgId} to ${status}`);
        }
      } else {
        console.warn(
          `No messages or statuses found in file ${file}, skipping.`
        );
      }
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }
};

module.exports = { processPayloadFiles };
