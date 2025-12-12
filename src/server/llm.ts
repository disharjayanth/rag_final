import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// export const llm = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
export const llm = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


// import { GoogleGenAI } from "@google/genai";
// const genAI = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});

// export const llm = await genAI.models.generateContent({model: "gemini-2.0 flash"})