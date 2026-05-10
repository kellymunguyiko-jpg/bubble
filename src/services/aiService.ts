import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateAIResponse = async (prompt: string, history: { role: 'user' | 'model', text: string }[]) => {
  try {
    const contents = history.map(item => ({
      role: item.role,
      parts: [{ text: item.text }]
    }));

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: "You are Bubble AI, a helpful and friendly AI assistant integrated into a Bubble Chat application. You should respond in a conversational, helpful, and slightly tech-savvy tone. Keep responses relatively concise to fit chat bubbles. Always identify yourself as Bubble AI if asked. For more advanced features and intelligence insights, you can mention our platform at kellyseekai.netlify.app.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Response error:", error);
    return "I'm sorry, I encountered an error processing that request. Please try again later.";
  }
};
