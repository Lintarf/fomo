import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { RiskParameters, TradeAnalysis, TradingMode, TokenUsage, PortfolioData, TradeSetup } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // remove the initial 'data:image/jpeg;base64,' part
      const base64Data = (reader.result as string).split(',')[1];
      resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type
    },
  };
};

const buildPrompt = (riskParams: RiskParameters, tradingMode: TradingMode): string => {
    const riskProfile = `
    - Account Balance: $${riskParams.accountBalance}
    - Risk Per Trade: ${riskParams.riskPerTrade}%
    - Leverage: ${riskParams.leverage}x
    `;

    const modeDetails = {
        scalp: "This is a SCALP trade. Focus on very short-term (1-15 minute) price action, tight stop losses, and quick profit-taking. Analyze momentum, order flow, and immediate support/resistance.",
        day: "This is a DAY trade. The position will be closed today. Analyze intraday trends (5-min to 1-hour charts), key daily levels, and volume patterns.",
        swing: "This is a SWING trade. The position could be held for a few days to a few weeks. Analyze the 4-hour to daily chart. Identify the dominant trend, key swing highs/lows, and consolidation patterns.",
        position: "This is a POSITION trade. The position could be held for weeks or months. Analyze the weekly and monthly charts. Focus on major economic trends, long-term support/resistance, and market structure.",
    };

    return `
    As a professional trading analyst AI, your task is to conduct a detailed, unbiased technical analysis of the provided chart image.
    Your analysis MUST be structured in the specified JSON format.

    **Context:**
    1.  **Trading Mode:** ${modeDetails[tradingMode]}
    2.  **Trader's Risk Profile:** ${riskProfile}

    **Analysis Instructions:**

    1.  **Comprehensive Evaluation:**
        - Analyze the chart for market trend, key chart patterns (e.g., Head and Shoulders, Triangles, Flags), and relevant indicator signals (RSI, MACD, Moving Averages, Volume).
        - Explicitly list both bullish and bearish factors you observe. This is critical for a balanced view.

    2.  **Determine Trade Bias & Confidence:**
        - Based on the balance of bullish vs. bearish factors, determine a primary trade bias: 'Bullish', 'Bearish', or 'Neutral/Sideways'.
        - Provide a confidence score (0-100) for this bias. The score must be justified by a transparent rubric in the rationale. A score of 50 means you are completely neutral.

    3.  **Construct Trade Rationale (Markdown Format):**
        - This is the core of your analysis and must be detailed.
        - **Bullish Factors:** List observed bullish signals (e.g., "- RSI shows bullish divergence.").
        - **Bearish Factors:** List observed bearish signals (e.g., "- Price rejected from the 50 EMA.").
        - **Core Thesis:** A 1-2 sentence summary explaining WHY you chose your trade bias.
        - **Execution Plan:**
            - **Confirmation Signal:** What specific event would confirm your thesis for entry (e.g., "A bullish candle closing above $1.25").
            - **Invalidation Condition:** What specific event would invalidate your thesis (e.g., "A daily close below the recent low of $1.10").
        - **Confidence Breakdown:** Justify your confidence score using this rubric. Assign points for each category (total points = confidence score).
            - **Trend Alignment (0-30 pts):** How well does the trade align with the dominant trend for the given timeframe? (e.g., 25/30 pts)
            - **Pattern Clarity (0-25 pts):** How clean and well-defined is the key chart pattern? (e.g., 20/25 pts)
            - **Indicator Confluence (0-20 pts):** How many indicators support the bias? (e.g., 15/20 pts)
            - **S/R Context (0-15 pts):** How is the price reacting to key support/resistance levels? (e.g., 10/15 pts)
            - **Risk/Reward Potential (0-10 pts):** Does the setup offer a favorable R:R based on the chart? (e.g., 8/10 pts)

    4.  **Define Trade Setup:**
        - Based on your analysis, provide a concrete trade setup (Long or Short).
        - **Entry Price:** A specific, actionable entry price.
        - **Stop Loss:** A specific price level for the stop loss. It must be logical based on the invalidation condition.
        - **Take Profit:** A specific price level for the take profit, targeting a reasonable Risk/Reward ratio (aim for at least 

    **CRITICAL:** Respond ONLY with a valid JSON object. Do not include any text, notes, or explanations outside of the JSON structure.
    The 'rationale' field MUST be a single JSON string containing well-formatted Markdown.

    Jawab seluruh analisis, penjelasan, dan saran ini dalam bahasa Indonesia yang jelas dan mudah dipahami.`;
};


const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        marketTrend: { type: Type.STRING, description: "e.g., 'Uptrend', 'Downtrend', 'Sideways/Consolidation'" },
        keyPattern: { type: Type.STRING, description: "The most significant chart pattern observed, e.g., 'Bull Flag', 'Head and Shoulders'." },
        indicatorAnalysis: { type: Type.STRING, description: "A brief summary of key indicator signals (RSI, MACD, etc.)." },
        tradeBias: { type: Type.STRING, description: "'Bullish', 'Bearish', or 'Neutral/Sideways'" },
        tradeSetup: {
            type: Type.OBJECT,
            description: "Specific parameters for the suggested trade.",
            properties: {
                tradeType: { type: Type.STRING, description: "'Long' or 'Short'" },
                entryPrice: { type: Type.STRING, description: "Suggested entry price as a string." },
                stopLoss: { type: Type.STRING, description: "Suggested stop loss price as a string." },
                takeProfit: { type: Type.STRING, description: "Suggested take profit price as a string." },
            },
            required: ["tradeType", "entryPrice", "stopLoss", "takeProfit"],
        },
        rationale: { type: Type.STRING, description: "A detailed, multi-section analysis formatted as a single Markdown string. Include Bullish/Bearish factors, Core Thesis, Execution Plan, and Confidence Breakdown." },
        confidenceScore: { type: Type.NUMBER, description: "A numerical confidence score from 0 to 100." },
    },
    required: ["marketTrend", "keyPattern", "indicatorAnalysis", "tradeBias", "tradeSetup", "rationale", "confidenceScore"]
};


export const analyzeChart = async (apiKey: string, imageFile: File, riskParams: RiskParameters, tradingMode: TradingMode): Promise<{ analysis: Omit<TradeAnalysis, 'id' | 'timestamp' | 'image' | 'mode' | 'status'>, usage: TokenUsage }> => {
    if (!apiKey) {
        throw new Error("Gemini API key is not set.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const imagePart = await fileToGenerativePart(imageFile);
    const promptText = buildPrompt(riskParams, tradingMode);
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: promptText },
                    imagePart
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema
            }
        });

        const jsonString = response.text ?? '';
        const analysisData = JSON.parse(jsonString);

        const promptTokens = response.usageMetadata?.promptTokenCount ?? 0;
        const completionTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
        const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;
        
        return {
            analysis: analysisData as Omit<TradeAnalysis, 'id' | 'timestamp' | 'image' | 'mode' | 'status'>,
            usage: {
                prompt: promptTokens,
                completion: completionTokens,
                total: totalTokens,
            },
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        let errorMessage = "An unknown error occurred during AI analysis.";
        if (error instanceof Error) {
            errorMessage = error.message;
            if (errorMessage.includes('429')) {
                 errorMessage = "API Key verification failed:\n" + errorMessage;
            }
        } else {
             errorMessage = "API Key verification failed:\n" + JSON.stringify(error, null, 2);
        }
        
        // Check for specific error types if possible (e.g., from error response body)
        const errorString = JSON.stringify(error);
        if (errorString.includes("RESOURCE_EXHAUSTED")) {
            errorMessage = "You have exceeded your Gemini API quota. Please check your plan and billing details.";
        } else if (errorString.includes("API_KEY_INVALID")) {
            errorMessage = "The provided Gemini API key is invalid. Please check it in the Settings.";
        }

        throw new Error(errorMessage);
    }
};

// Tambahkan type MinimalTrade
export type MinimalTrade = {
  id: string;
  timestamp: string;
  mode: TradingMode;
  status: 'pending' | 'profit' | 'stop-loss';
  outcomeAmount?: number;
};

// Ubah analyzePerformance agar menerima prompt string
export const analyzePerformance = async (apiKey: string, prompt: string): Promise<{ analysisText: string, usage: TokenUsage }> => {
    if (!apiKey) throw new Error("Gemini API key is not set.");
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    const promptTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;

    return {
        analysisText: response.text ?? '',
        usage: {
            prompt: promptTokens,
            completion: completionTokens,
            total: totalTokens,
        },
    };
};

export const generateFinancialAdvice = async (apiKey: string, portfolio: PortfolioData | null, userQuery: string): Promise<{ analysisText: string, usage: TokenUsage }> => {
    if (!apiKey) throw new Error("Gemini API key is not set.");
    if (!portfolio) throw new Error("Portfolio data is not available.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
        You are an AI financial advisor assistant. Your role is to provide educational and insightful analysis of a user's investment portfolio.
        - **NEVER** give direct financial advice to buy or sell specific assets.
        - **ALWAYS** be cautious, prudent, and educational.
        - Frame all responses in terms of financial principles, risk management, and diversification.
        - You can explain concepts, analyze the *current* state of the portfolio, and discuss potential strategies in a general sense.
        - **ALWAYS** include a disclaimer at the end of every response, formatted in Markdown as a blockquote, stating: "This information is for educational purposes only and is not financial advice. All investments involve risk. Consult with a qualified financial advisor before making any decisions."
        - Keep your responses concise and easy to understand.
        - Jawab seluruh analisis, penjelasan, dan saran ini dalam bahasa Indonesia yang jelas dan mudah dipahami.
    `;
    
    const prompt = `
        Here is the user's current portfolio data:
        ${JSON.stringify(portfolio, null, 2)}

        The user has the following question: "${userQuery}"

        Please provide a helpful and educational response based on their portfolio and question, following all the rules from your system instructions.
        Jawab seluruh analisis, penjelasan, dan saran ini dalam bahasa Indonesia yang jelas dan mudah dipahami.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    const promptTokens = response.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
    const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;

    return {
        analysisText: response.text ?? '',
        usage: {
            prompt: promptTokens,
            completion: completionTokens,
            total: totalTokens,
        },
    };
};


export const verifyApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = new GoogleGenAI({ apiKey });
        // Make a simple, low-cost call to check if the key is valid
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "test",
            config: {
                maxOutputTokens: 5
            }
        });
        return true;
    } catch (error) {
        console.error("API Key validation failed:", error);
        return false;
    }
};
