import { GoogleGenAI } from "@google/genai";
import type { Account } from "../types";

// Safe access to environment variables in different environments (Vite, Webpack, Node)
const getEnvApiKey = () => {
  try {
    // @ts-ignore - Vite uses import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
    // Webpack/Node uses process.env
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Could not access environment variables");
  }
  return undefined;
};

const getClient = (userApiKey?: string) => {
  // Prioritize user-provided key, fallback to environment variable
  const apiKey = userApiKey || getEnvApiKey();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getDebtAnalysis = async (accounts: Account[], userApiKey?: string): Promise<string> => {
  const ai = getClient(userApiKey);
  
  if (!ai) {
    return "To use the AI Debt Advisor, please click the Settings (gear icon) in the top right and enter your Google Gemini API Key. You can get one for free at aistudio.google.com.";
  }

  // Prepare data summary for the prompt
  const accountsSummary = accounts.map(a => ({
    name: a.name,
    type: a.type,
    rate: `${a.interestRate}%`,
    currentBalance: a.history[a.history.length - 1]?.balance || 0
  }));

  const prompt = `
    I am a financial debt tracking application user. Here is my current liability portfolio:
    ${JSON.stringify(accountsSummary, null, 2)}

    Please analyze my debt situation.
    1. Identify which debt I should pay off first using the Avalanche method (highest interest rate first).
    2. Provide a brief, encouraging summary of my financial health based on these numbers.
    3. Give me 3 actionable bullet points to reduce my debt faster.

    Keep the response concise, friendly, and formatted in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster simple response
      }
    });

    return response.text || "No analysis could be generated at this time.";
  } catch (error) {
    console.error("Error fetching debt analysis:", error);
    return "Sorry, I encountered an error while analyzing your data. Please check your API Key and try again.";
  }
};