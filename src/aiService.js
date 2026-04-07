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
        // Switching to the 1.5-flash pool which has its own separate quota
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

/**
 * Handles chat interaction with Unibot AI using Gemini.
 * 
 * @param {string} userMessage - The message from the student.
 * @returns {Promise<string>} - The AI's response.
 */
export const getUnibotResponse = async (userMessage) => {
    // Separate quota pool for 1.5 models
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];
    
    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            const systemPrompt = `
                You are "Unibot", a highly intelligent and specialized AI assistant for Andhra University (AU), Visakhapatnam.
                
                Guidelines:
                1. Provide concise, factual, and expert-level information about Andhra University.
                2. Your response must be short and direct. Limit it to 2-3 sentences maximum.
                3. Be professional, informative, and as capable as the standard Google Gemini assistant.
                
                User Inquiry: "${userMessage}"
            `;

            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            const text = response.text();
            
            if (text) return text;
        } catch (error) {
            console.warn(`Unibot: Model ${modelName} failed or limit reached. Trying next...`, error);
            // Continue loop to next model
        }
    }

    return "I'm sorry, all my primary data connections (AI models) are currently experiencing high load. Please try again in 5-10 minutes, or reach out to the AU Helpline (0891-2844000).";
};

/**
 * Step 2: Semantic Duplicate Detection
 * Detects if a new report matches an existing open issue.
 */
export const checkDuplicateWithGemini = async (newTitle, newLocation, recentIssues) => {
    if (!recentIssues || recentIssues.length === 0) return null;

    try {
        // Using the high-limit 1.5-flash pool to bypass the 2.0 daily limits
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are an AU Campus Moderator. Compare the NEW ISSUE against 5 RECENT ISSUES.
            
            NEW ISSUE:
            Title: "${newTitle}"
            Area: "${newLocation}"

            RECENT ISSUES IN THIS DEPT:
            ${recentIssues.map((issue, i) => `${i + 1}. [ID: ${issue.id}] Title: "${issue.title}", Area: "${issue.manualLocation}"`).join('\n')}

            TASK:
            Is the NEW ISSUE talking about the same physical problem? 
            Example: "Water leakage in C-Block" and "C-Block bathroom tap broken" are a MATCH.
            Example: "Fan not working" and "Power switch broken" in the same room are a MATCH.

            RULES:
            1. If it's a match, respond ONLY with the ID of that issue.
            2. If no match is found, respond ONLY with the word "null".
            3. respond in plain text, no bolding, no markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        console.log("Gemini Duplicate Detection Result:", text);

        if (text.toLowerCase().includes('null')) return null;
        
        // Clean up the response in case AI adds extra text
        const matchedId = text.match(/[a-zA-Z0-9]{15,}/); 
        return matchedId ? matchedId[0] : null;
    } catch (error) {
        console.error("Duplicate Check Error:", error);
        return null;
    }
};
