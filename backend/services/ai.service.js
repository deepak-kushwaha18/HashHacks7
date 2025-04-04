import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40
    }
});

function formatResponse(text) {
    try {

        return JSON.parse(text);
    } catch (error) {

        return {
            text: text.trim(),
            fileTree: {}
        };
    }
}

export const generateResult = async (prompt) => {
    if (!process.env.GOOGLE_AI_KEY) {
        console.error("❌ AI Service Error: GOOGLE_AI_KEY is not configured");
        throw new Error("AI service is not properly configured. Please check the server logs.");
    }

    if (!prompt || typeof prompt !== "string") {
        console.error("❌ AI Service Error: Invalid prompt:", prompt);
        throw new Error("Invalid prompt: must be a non-empty string.");
    }

    try {
        console.log("🟢 AI Service: Processing prompt:", prompt);

        const response = await model.generateContent(prompt);

        const text = response.response.text();

        if (!text) {
            console.error("❌ AI Service Error: Empty response from AI model");
            throw new Error("Empty response from AI model.");
        }

        console.log("✅ AI Service: Successfully generated response:", text);
        
        return formatResponse(text);
    } catch (error) {
        console.error("❌ AI Service Error:", error.message || error);

        if (error.message.includes("API key")) {
            throw new Error("AI service configuration error: Please check your API key and model access.");
        }

        if (error.message.includes("quota")) {
            throw new Error("AI service quota exceeded. Please try again later.");
        }

        if (error.message.includes("rate limit")) {
            throw new Error("AI service rate limit exceeded. Please try again later.");
        }

        throw new Error("Unable to process your request at this time. Please try again later.");
    }
};
