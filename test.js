const { sendLinkedInMessage } = require("./utils/sendMessage");
const { generateText } = require("./utils/generateText");

(async () => {
    const text = await generateText("Google", "Istanbul", "Software Engineer", "Senior", "Full-time", "https://google.com");
    sendLinkedInMessage("https://www.linkedin.com/in/bahri-uranl%C4%B1-093b05273/", text);
})();
