
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const geminiService = {
  /**
   * Generates a tutor response based on user context, current learning module, and chat history.
   * Encourages interactive practice tasks and constructive feedback.
   */
  async getTutorResponse(question: string, userProfile: string, moduleContext: string = '', history: ChatMessage[] = []) {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: question }] }
      ] as any,
      config: {
        systemInstruction: `You are the Lead Digital Marketing Professor at MarketerAI Academy.
        
        USER PROFILE: ${userProfile}
        CURRENT MODULE CONTEXT: ${moduleContext || 'General Marketing Overview'}
        
        YOUR MISSION:
        1. Be a mentor, not just an encyclopedia. 
        2. When asked for a "practice task", generate a highly specific, real-world exercise (e.g., "Write a meta description for a luxury cat toy shop") rather than general theory.
        3. If a user submits work for review, provide rigorous but encouraging feedback based on industry standards (SEO best practices, conversion psychology, etc.).
        4. Use standard Markdown for formatting (bolding, lists, code blocks).
        5. Keep responses concise but impactful.
        6. Link concepts back to the 17 marketing pillars whenever possible.
        
        FORMATTING RULES:
        - NEVER output literal markdown symbols like "**" in a way that doesn't render. 
        - Use bold text for key terms and calls to action.`
      }
    });
    
    return response.text;
  },

  async summarizeTrend(content: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following digital marketing news in a simple, actionable way for students. 
      Use bullet points for key takeaways.
      
      Content: ${content}`,
    });
    return response.text;
  },

  async suggestPersonalizedPath(profileJson: string) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Based on this user profile: ${profileJson}, suggest a learning path of 5 specific focus areas from the 17 marketing pillars. 
      Format the output as a JSON array of strings containing just the pillar names.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    try {
      return JSON.parse(text.trim());
    } catch (e) {
      console.error("Failed to parse personalized path JSON", e);
      return [];
    }
  }
};
