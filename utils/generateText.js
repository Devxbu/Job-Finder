require("dotenv").config();
const { Groq } = require("groq-sdk");

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.warn("GROQ_API_KEY is not set. generateText() will fail at runtime.");
}
const groq = new Groq({ apiKey });

module.exports.generateText = async (
  companyName = "Not specified",
  location = "Not specified",
  description = "Not specified",
  level = "Not specified",
  role = "Not specified",
  time = "Not specified",
  website = "Not specified"
) => {
  const prompt = `   
    You are an AI assistant helping write professional job application emails.

    Applicant info:
    Name: Bahri Uranlı
    Email: bahri.official@protonmail.com
    LinkedIn: https://www.linkedin.com/in/bahri-uranl%C4%B1-035318213/
    GitHub: https://github.com/Devxbu
    Location: Istanbul, Turkey
    Resume: Attached as PDF (BAHRI_URANLI_CV.pdf)
    Experience: Founder of MelodyWay (QR-based music voting app), Focus Flow (productivity app), CTO of EKA_CS (B2B Freelance Platform).
    Skills: React, Node.js, MongoDB, PHP, JavaScript, Python, C, C++, AI fundamentals.
    Education: École 42 Istanbul (Software Engineering), Isparta University of Applied Sciences (Computer Programming).

    Now write a professional job application email for the company below.

    Company: ${companyName}
    Website: ${website}
    Description: ${description}
    Role: ${role}
    Location: ${location}
    Level: ${level}
    Employment type: ${time}

    The email should:
    - Be polite and personalized.
    - Mention how Bahri’s skills align with the company’s work.
    - Express enthusiasm and readiness to contribute.
    - Include Bahri’s contact details and LinkedIn/GitHub links.

    Format the output as a ready-to-send email body.

    Just return the email body, do not include any additional text.

    Dont write the email subject or any other text.
    `;
  let string = "";

  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": prompt,
      },
    ],
    "model": "llama-3.1-8b-instant",
    "temperature": 1,
    "max_completion_tokens": 1024,
    "top_p": 1,
    "stream": true,
    "stop": null
  });

  for await (const chunk of chatCompletion) {
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) {
      string += delta?.content;
    }
  }

  return string;
}
