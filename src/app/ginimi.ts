import{ GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,

});

export async function askGemini(message: string) {
    const response = await ai.models.generateContent({
        model: "gimini-3.6-flash",
        contents: message,
    });
    return response.text;
}
