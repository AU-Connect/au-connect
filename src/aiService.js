import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI with your API Key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

/**
 * Classifies a campus complaint into predefined categories using Gemini AI.
 * Categories: Electrical, Civil, Internet, Sanitation, Academic.
 * 
 * @param {string} description - The user's issue description.
 * @returns {Promise<string>} - The classified category.
 */
export const classifyComplaint = async (description) => {
    try {
        // Use the gemini-1.5-flash model for fast and efficient classification
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are a campus administrator for Andhra University. 
            Your task is to categorize the following student complaint into exactly ONE of these categories: 
            Electrical, Civil, Internet, Sanitation, Academic.

            Complaint: "${description}"

            Rules:
            1. Respond ONLY with a valid JSON object in the format: {"category": "category_name"}
            2. Do not include any other text, explanation, or markdown formatting in your response.
            3. Choose the most relevant category based on the content of the complaint.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Robust JSON extraction using Regex
        // This finds the first '{' and the last '}' and extracts everything in between
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("AI did not return a valid JSON format");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.category;
    } catch (error) {
        console.error("AI Classification Error:", error);
        // Fallback or re-throw depending on how you want to handle failures in UI
        throw error;
    }
};
