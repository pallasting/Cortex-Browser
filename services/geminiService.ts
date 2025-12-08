
import { GoogleGenAI } from "@google/genai";

// NOTE: In a production version of Cortex, this API Key would be managed via user settings 
// or through the hypothetical "Cortex Cloud" proxy.
// For this demo, we assume the environment variable is set or prompt the user.

let memoryApiKey: string | null = null;

export const setMemoryApiKey = (key: string) => {
    memoryApiKey = key;
}

const getAiClient = () => {
  let apiKey = process.env.API_KEY || memoryApiKey;
  
  if (!apiKey) {
      try {
          apiKey = localStorage.getItem("GEMINI_API_KEY");
      } catch (e) {
          // Ignore security errors (sandboxed iframe)
      }
  }

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePageInsight = async (pageContent: string, modelName: string = "gemini-2.5-flash"): Promise<string> => {
  try {
    const ai = getAiClient();
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
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Interaction Error:", error);
    throw error;
  }
};

export const generateAgentThought = async (userIntent: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: `You are the kernel of a cyberpunk AI Browser Agent. The user wants to perform this action: "${userIntent}".
          
          Generate a single, short, extremely technical system log line (max 15 words) describing your internal planning process/thought.
          Use terms like "DOM traversal", "Vector search", "Heuristic matching", "Shadow DOM injection", "Computing gradients".
          Do not use markdown. Do not use quotes. Just the raw log text.
          
          Example: "Traversing DOM tree to identify candidates matching relevance threshold > 0.85..."`
        }
      ],
       config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    
    return response.text || "Processing neural weights...";
  } catch (error) {
    // Fallback if API fails, so the UI doesn't break
    return "Allocating tensors for action execution...";
  }
};
