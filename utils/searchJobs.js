const axios = require("axios");
require("dotenv").config();

module.exports.fetchData = async (
  location = "",
  keyword = "",
  country = "",
  time_range = "",
  job_type = "",
  experience_level = "",
  remote = "",
  company = "",
  location_radius = ""
) => {
  const apiKey = process.env.BRIGHTDATA_API_KEY;
  if (!apiKey) {
    console.warn("BRIGHTDATA_API_KEY is not set. fetchData() will return an empty list.");
    return [];
  }

  const data = JSON.stringify({
    input: [
      {
        location,
        keyword,
        country,
        time_range,
        job_type,
        experience_level,
        remote,
        company,
        location_radius,
      },
    ],
  });
  axios.defaults.timeout = 900000; // Increase to 15 minutes
  let response;
  const maxRetries = 3;
  let lastError;
  let snapshot;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: Fetching jobs from BrightData...`);
      response = await axios.post(
        "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_lpfll7v5hcqtkxl6l&notify=false&include_errors=false&type=discover_new&discover_by=keyword",
        data,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 900000, // 15 minutes
        }
      );
      if(response?.data?.message?.startsWith("Your request is still in progress")) {
        snapshot = response.data.snapshot_id;
        break;
      }
      console.log("Successfully fetched data from BrightData");
      break; // Success, exit retry loop
    } catch (error) {
      lastError = error;
      console.error(`\nAttempt ${attempt} failed:`);
      console.error("Status:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);
      console.error("Response Data:", JSON.stringify(error.response?.data, null, 2));
      
      if (attempt < maxRetries && (error.code === 'ETIMEDOUT' || error.response?.status === 500)) {
        const waitTime = attempt * 5000; // Exponential backoff: 5s, 10s, 15s
        console.log(`Waiting ${waitTime / 1000}s before retry...\n`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (attempt === maxRetries) {
        console.error("\nAll retry attempts failed.");
        console.error("Request Data:", data);
        throw error;
      } else {
        throw error; // Non-retryable error
      }
    }
  }

  if(snapshot) {
    console.log(`Fetching snapshot: ${snapshot}`);
    response = await axios.get(
      `https://api.brightdata.com/datasets/v3/snapshot/${snapshot}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 900000,
      }
    );
  }

  let body = response ? response.data : [];
  console.log("Response type:", typeof body);
  
  // If body is a string, parse as NDJSON (newline-delimited JSON)
  if (typeof body === 'string') {
    console.log("Parsing string response as NDJSON...");
    const lines = body.trim().split('\n').filter(line => line.trim());
    body = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.error("Failed to parse line:", line);
        return null;
      }
    }).filter(item => item !== null);
  }
  
  // Handle different response structures
  const items = Array.isArray(body)
    ? body
    : Array.isArray(body?.results)
    ? body.results
    : Array.isArray(body?.data)
    ? body.data
    : [];

  console.log(`Found ${items.length} job(s)`);
  
  if (items.length > 0) {
    console.log("Sample job keys:", Object.keys(items[0]));
  }

  const arr = [];

  for (const job of items) {
    const job_json = {};
    job_json["title"] = job?.company_name || job?.company || "Not specified";
    job_json["location"] = job?.job_location || job?.location || "Not specified";
    job_json["description"] = job?.job_summary || job?.description || "Not specified";
    job_json["link"] = job?.job_url || job?.url || "Not specified";
    job_json["level"] = job?.job_seniority_level || job?.seniority || "Not specified";
    job_json["role"] = job?.job_function || job?.role || "Not specified";
    job_json["time"] = job?.job_employment_type || job?.employment_type || "Not specified";
    job_json["website"] = job?.company_url || job?.website || "Not specified";
    job_json["email"] = "bahri.official@protonmail.com";
    arr.push(job_json);
  }
  
  console.log(`Processed ${arr.length} job(s)`);
  return arr;
}
