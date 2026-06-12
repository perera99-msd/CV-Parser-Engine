const { GoogleGenAI, Type } = require('@google/genai');

let ai;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI(); // It will automatically use the GEMINI_API_KEY environment variable
}

async function parseWithAI(rawText) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The full name of the applicant. Default to 'Unknown Applicant' if missing." },
      email: { type: Type.STRING, description: "The applicant's email address." },
      phone: { type: Type.STRING, description: "The applicant's phone number." },
      location: { type: Type.STRING, description: "The applicant's location or address." },
      summary: { type: Type.STRING, description: "The professional summary or profile overview of the applicant." },
      skills: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A flat array of all technical and soft skills. Group items into individual strings without categories."
      },
      experience: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            role: { type: Type.STRING, description: "The job title or role." },
            company: { type: Type.STRING, description: "The name of the company or organization." },
            duration: { type: Type.STRING, description: "The time period of employment." },
            details: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bullet points describing responsibilities and achievements." }
          }
        }
      },
      projects: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the project. Do not omit any projects found in the text." },
            techStack: { type: Type.STRING, description: "Technologies, languages, or tools used in this project. Summarize into a string." },
            link: { type: Type.STRING, description: "URL, GitHub link, or deployment link if present." },
            details: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exhaustive bullet points detailing features, tasks, and achievements for this project." }
          }
        }
      },
      education: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            degree: { type: Type.STRING, description: "The degree or qualification obtained." },
            institution: { type: Type.STRING, description: "The university or school." },
            year: { type: Type.STRING, description: "The graduation year or duration." }
          }
        }
      },
      certifications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The official name of the certification, license, or badge." },
            issuer: { type: Type.STRING, description: "The organization, institution, or platform that issued it (e.g., HackerRank, Coursera, Oracle)." },
            year: { type: Type.STRING, description: "The year or exact date it was obtained. Extract this carefully from the text." }
          }
        }
      }
    },
    required: ["name", "email", "phone", "skills", "experience", "projects", "education", "certifications"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Extract the requested details from the following resume text. Fix any formatting or interleaved columns caused by PDF extraction. Ensure the output strictly follows the provided JSON schema.\n\nRESUME TEXT:\n${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1 // Keep it deterministic
    }
  });

  try {
    const data = JSON.parse(response.text);
    // Ensure rawText is also preserved in the output
    data.rawText = rawText;
    return data;
  } catch (err) {
    console.error("Failed to parse AI response as JSON:", err);
    throw new Error("AI returned invalid JSON.");
  }
}

module.exports = { parseWithAI };
