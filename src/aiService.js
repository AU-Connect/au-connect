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
        // Using the highly stable, most compatible identifier: gemini-1.5-flash
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
        console.warn("Gemini API Limit or Error reached. Using local fallback categorization.", error);
        
        // Robust Local Fallback (Keyword Matching)
        const d = (description || "").toLowerCase();
        if (d.includes('light') || d.includes('wire') || d.includes('power') || d.includes('fan') || d.includes('switch')) return "Electrical";
        if (d.includes('leak') || d.includes('wall') || d.includes('crack') || d.includes('door') || d.includes('floor')) return "Civil";
        if (d.includes('wifi') || d.includes('internet') || d.includes('network') || d.includes('offline')) return "Internet";
        if (d.includes('water') || d.includes('trash') || d.includes('waste') || d.includes('sanitation') || d.includes('dirty')) return "Sanitation";
        if (d.includes('class') || d.includes('exam') || d.includes('attendance') || d.includes('subject')) return "Academic";
        
        return "General";
    }
};

/**
 * Handles chat interaction with Unibot AI using Gemini.
 * 
 * @param {string} userMessage - The message from the student.
 * @returns {Promise<string>} - The AI's response.
 */
export const getUnibotResponse = async (userMessage) => {
    // TEMPORARY: Disabled Gemini API for Unibot to prioritize API budget for auto-categorization
    // The UI and logic remain intact, but it now returns a mock response
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const msg = userMessage.toLowerCase();

    if (msg.includes('fee')) {
        return "Regular PG/Professional exam fees are approximately ₹805. Please pay online via the AU Exams portal (exams.andhrauniversity.edu.in). No demand drafts are accepted.";
    }

    if (msg.includes('seat')) {
        return "B.Tech CSE Through AUEET has 540 seats (Self-Support mode) out of 690 total Engineering seats. Detailed branch-wise allotments are available in the admission brochure.";
    }

    if (msg.includes('contact') || msg.includes('phone') || msg.includes('call')) {
        return "You can reach AU support at 0891-2844000 or 0891-2844197. For official enquiries, email: enquiry@andhrauniversity.edu.in.";
    }

    return "Hello! I am currently in 'Demo Mode' so we can prioritize the system's background processes. I can still help with basic info about AU fees, AUEET seats, and contact numbers. How can I assist you today?";
};

