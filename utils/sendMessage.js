const puppeteer = require("puppeteer");
require("dotenv").config();

/**
 * Send a message to a LinkedIn user
 * @param {string} profileUrl - LinkedIn profile URL
 * @param {string} message - Message to send
 * @param {boolean} headless - Run browser in headless mode (default: false for debugging)
 * @returns {Promise<boolean>} - Success status
 */
module.exports.sendLinkedInMessage = async (profileUrl, message, headless = false) => {
    const linkedInEmail = process.env.LINKEDIN_EMAIL;
    const linkedInPassword = process.env.LINKEDIN_PASSWORD;

    if (!linkedInEmail || !linkedInPassword) {
        throw new Error("LINKEDIN_EMAIL and LINKEDIN_PASSWORD must be set in .env file");
    }

    if (!profileUrl || !message) {
        throw new Error("profileUrl and message are required");
    }

    let browser;
    try {
        console.log("Launching browser...");
        browser = await puppeteer.launch({
            headless,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setDefaultNavigationTimeout(90000);

        // Login to LinkedIn
        console.log("Navigating to LinkedIn login...");
        await page.goto("https://www.linkedin.com/login", { waitUntil: "networkidle2" });

        console.log("Logging in...");
        await page.type("#username", linkedInEmail);
        await page.type("#password", linkedInPassword);

        // Wait for navigation after login - use Promise.all to handle navigation properly
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle2" }),
            page.click('button[type="submit"]')
        ]);

        // Check if login was successful or if CAPTCHA/checkpoint is shown; if so, wait for user to complete
        let currentUrl = page.url();
        if (currentUrl.includes("/checkpoint") || currentUrl.includes("/login")) {
            console.log("Checkpoint/CAPTCHA or login page detected. Waiting for completion...");
            try {
                await page.waitForFunction(
                    () => !location.pathname.includes('/checkpoint') && !location.pathname.includes('/login'),
                    { timeout: 600000 }
                );
                await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
            } catch (e) {
                console.log("Still on checkpoint/login after waiting. You may need to complete CAPTCHA or verification.");
            }
            currentUrl = page.url();
        }

        console.log("Login successful!");

        // Navigate to profile
        console.log(`Navigating to profile: ${profileUrl}`);
        await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 90000 });

        // Wait for profile content to load
        await page.waitForSelector('.ph5, .pv-top-card', { timeout: 30000 }).catch(() => {
            console.log("Profile loaded (selector not found, but page loaded)");
        });

        // Ensure lazy content loads by scrolling down then back up
        console.log("Scrolling through profile to load content...");
        await page.evaluate(async () => {
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            const distance = Math.max(window.innerHeight, 400);
            let lastScrollY = -1;
            // Scroll down in steps until bottom reached or no progress
            for (let i = 0; i < 50; i++) {
                window.scrollBy(0, distance);
                await sleep(200);
                if (Math.abs(window.scrollY - lastScrollY) < 2) break;
                lastScrollY = window.scrollY;
                if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) break;
            }
            await sleep(500);
            // Scroll back to top
            for (let i = 0; i < 50 && window.scrollY > 0; i++) {
                window.scrollBy(0, -distance);
                await sleep(100);
            }
            window.scrollTo(0, 0);
        });

        // Find and click the "Message" button
        console.log("Looking for Message button...");

        // Try multiple selectors as LinkedIn's UI can vary
        const messageButtonSelectors = [
            'button[aria-label*="Message"]',
            'button:has-text("Message")',
            '.pvs-profile-actions button:has-text("Message")',
            'a[href*="/messaging/"]',
        ];

        let messageButton = null;
        for (const selector of messageButtonSelectors) {
            try {
                if (selector === 'button[aria-label*="Message"]') {
                    const buttons = await page.$$(selector);
                    messageButton = buttons && buttons.length > 1 ? buttons[1] : buttons[0];
                } else {
                    messageButton = await page.$(selector);
                }
                if (messageButton) {
                    console.log(`Found message button with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!messageButton) {
            throw new Error("Could not find Message button. User may not accept messages or connection is required.");
        }

        // Click the message button
        await messageButton.click();
        console.log("Clicked Message button");

        // Wait for message input to appear
        const interval2 = setInterval(() => {
            console.log("Waiting for message input to appear...");
        }, 9000);

        clearInterval(interval2);

        // Find the message input field
        console.log("Looking for message input field...");
        const messageInputSelectors = [
            'div[role="textbox"][contenteditable="true"]',
            '.msg-form__contenteditable',
            'div.msg-form__msg-content-container div[contenteditable="true"]',
        ];

        let messageInput = null;
        for (let i = 0; i < 1000 && !messageInput; i++) {
            for (const selector of messageInputSelectors) {
                try {
                    messageInput = await page.$(selector);
                    if (messageInput) {
                        console.log(`Found message input with selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
            console.log("Waiting for message input to appear...");
        }
        if (!messageInput) {
            // throw new Error("Could not find message input field");
            console.log("Could not find message input field");
        }

        // Type the message
        console.log("Typing message...");
        await messageInput.click();
        await page.keyboard.type(message, { delay: 50 });

        // Find and click the send button
        console.log("Looking for Send button...");
        const sendButtonSelectors = [
            'button[type="submit"]',
            'button.msg-form__send-button',
            'button:has-text("Send")',
        ];

        let sendButton = null;
        for (const selector of sendButtonSelectors) {
            try {
                sendButton = await page.$(selector);
                if (sendButton) {
                    const isEnabled = await page.evaluate(btn => !btn.disabled, sendButton);
                    if (isEnabled) {
                        console.log(`Found send button with selector: ${selector}`);
                        break;
                    }
                }
            } catch (e) {
                // Continue to next selector
            }
        }

        if (!sendButton) {
            console.log("Could not find Send button");
            // throw new Error("Could not find Send button");
        }

        // Click send
        await sendButton.click();
        console.log("Message sent successfully!");

        // Wait a bit to ensure message is sent
        const interval3 = setInterval(() => {
            console.log("Waiting for message to be sent...");
        }, 5000);

        clearInterval(interval3);

        return true;
    } catch (error) {
        console.error("Error sending LinkedIn message:", error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

/**
 * Send messages to multiple LinkedIn profiles
 * @param {Array<{profileUrl: string, message: string}>} recipients - Array of recipients
 * @param {number} delayBetweenMessages - Delay in ms between messages (default: 5000)
 * @returns {Promise<Array<{profileUrl: string, success: boolean, error?: string}>>}
 */
module.exports.sendBulkLinkedInMessages = async (recipients, delayBetweenMessages = 5000) => {
    const results = [];

    for (let i = 0; i < recipients.length; i++) {
        const { profileUrl, message } = recipients[i];
        console.log(`\nSending message ${i + 1}/${recipients.length} to ${profileUrl}`);

        try {
            await module.exports.sendLinkedInMessage(profileUrl, message);
            results.push({ profileUrl, success: true });
        } catch (error) {
            console.error(`Failed to send message to ${profileUrl}:`, error.message);
            results.push({ profileUrl, success: false, error: error.message });
        }

        // Add delay between messages to avoid rate limiting
        if (i < recipients.length - 1) {
            console.log(`Waiting ${delayBetweenMessages / 1000}s before next message...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenMessages));
        }
    }

    return results;
};