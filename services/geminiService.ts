import { GoogleGenAI } from "@google/genai";

// NOTE: In a production version of Cortex, this API Key would be managed via user settings 
// or through the hypothetical "Cortex Cloud" proxy.
// For this demo, we assume the environment variable is set or prompt the user.

export const generatePageInsight = async (pageContent: string, modelName: string = "gemini-2.5-flash"): Promise<string> => {
  const apiKey = process.env.API_KEY || localStorage.getItem("GEMINI_API_KEY");
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          text: `You are the AI engine embedded in a Rust-based browser called Cortex. 
          Analyze the following data extracted from a webpage (represented as a structured dataframe dump).
          Provide a concise, high-level summary of the content, highlighting key entities, trends, or anomalies.
          Keep it "geeky" and precise. Use markdown for formatting.
          
          Data Content:
          ${pageContent}`
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Flash model usually doesn't need thinking budget, but good practice to be explicit if switching models
      }
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Interaction Error:", error);
    throw error;
  }
};
