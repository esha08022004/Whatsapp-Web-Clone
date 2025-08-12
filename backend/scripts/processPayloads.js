const fs = require("fs");
const path = require("path");

const dir = process.argv[2]; 
const absolutePath = path.resolve(dir);

const files = fs.readdirSync(absolutePath);

const payloadDir = path.join(__dirname, "..", "payloads");

fs.readdirSync(payloadDir).forEach(file => {
  if (file.endsWith(".json")) {
    const filePath = path.join(payloadDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    try {
      const change = data.metaData?.entry?.[0]?.changes?.[0];
      const value = change?.value;

      const contactName = value?.contacts?.[0]?.profile?.name;
      const messageBody = value?.messages?.[0]?.text?.body;
      const fromNumber = value?.messages?.[0]?.from;
      const timestamp = value?.messages?.[0]?.timestamp;

      console.log(
        `${file} ->`,
        messageBody
          ? `"${messageBody}" from ${contactName || fromNumber} at ${timestamp}`
          : "No message found"
      );

    } catch (err) {
      console.error(`${file} -> Error parsing:`, err.message);
    }
  }
});
