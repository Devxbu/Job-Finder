require("dotenv").config();
const { fetchData } = require("./utils/searchJobs");
const { generateText } = require("./utils/generateText");
const { sendBulkLinkedInMessages } = require("./utils/sendMessage");
const fs = require("fs");

const main = async (location = "", keyword = "", country = "", time_range = "", job_type = "", experience_level = "", remote = "", company = "", location_radius = "") => {
  try {
    let arr = []
    const data = await fetchData(location, keyword, country, time_range, job_type, experience_level, remote, company, location_radius);
    for (const job of data) {
      const subject = `Job Application for ${job.role} at ${job.title}`;
      const text = await generateText(job.title, job.location, job.description, job.level, job.role, job.time, job.website);
      arr.push({profileUrl: job.link, message: text});
      console.log(`${job.title} added to array`);
      const job_details = require("./job_details.json");
      job_details.push(job);
      fs.writeFileSync("./job_details.json", JSON.stringify(job_details, null, 2));
    }
    await sendBulkLinkedInMessages(arr);
  } catch (err) {
    console.error("Error in main():", err?.message || err);
    process.exitCode = 1;
    return;
  }
};

main("istanbul", "fullstack developer", "TR", "Past month", "Full-time", "", "", "", "");
