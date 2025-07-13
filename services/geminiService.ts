import { RiskParameters, TradeAnalysis, TradingMode, TokenUsage, PortfolioData } from '../types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Tambahkan currentEquity ke parameter buildPrompt dan analyzeChart
type BuildPromptParams = RiskParameters & { currentEquity: number };

// Move modeDetails to module scope so it can be reused
const modeDetails = {
    scalp: "SCALP trade - 1-minute chart.",
    day: "DAY trade - 5-minute atau 15-minute chart.",
    swing: "SWING trade - 30-minute atau 1-hour chart.",
    position: "POSITION trade - daily atau weekly chart.",
};

const buildPrompt = (riskParams: BuildPromptParams, tradingMode: TradingMode): string => {
    return `Anda adalah AI analis trading profesional. User memilih mode: ${modeDetails[tradingMode]}.
Analisa chart yang diupload dan berikan saran trading dalam format JSON BERDASARKAN APA YANG TERLIHAT JELAS DI CHART.

- detectedTimeframe: WAJIB diisi, timeframe chart yang terdeteksi dari gambar (misal: '1m', '5m', '15m', '1H', '4H', '1D', dst). Jika tidak yakin, tulis 'Unknown'.
- Pilih leverage sesuai aturan berikut:
  - Konservatif (Swing/jangka menengah): 1x–3x
  - Moderat (Day trading): 5x–10x
  - Agresif (Scalping/spekulatif): 10x–20x
  - Ekstrem (High risk, short-term): >20x (WAJIB beri peringatan risiko!)
- tradeType: 'Long' atau 'Short'
- entryPrice, stopLoss, takeProfit: angka valid
- leverage: pilih sesuai aturan di atas dan mode trading user
- profitAmount: WAJIB diisi, estimasi profit USD dari trade setup yang diberikan (boleh estimasi sederhana, tidak boleh kosong)
- tradeBias: WAJIB diisi, bias utama trade berdasarkan analisa chart (Bullish, Bearish, atau Neutral)
- confidenceScore: angka antara 70-100 (jika sinyal jelas dan setup valid), atau di bawah 70 hanya jika benar-benar ragu/tidak yakin.
- marketTrend: trend utama yang TERLIHAT JELAS (bullish, bearish, sideways, atau Unknown jika tidak jelas)
- keyPattern: pola utama (misal: double top, head and shoulders, dsb, atau No clear pattern jika tidak ada)
- indicatorAnalysis: analisa indikator utama (RSI, MACD, MFI, dsb, atau No indicator analysis jika tidak ada)
- rationale: reasoning trading profesional, WAJIB dalam bentuk array bullet point (minimal 5 poin, setiap poin actionable dan spesifik, seperti contoh di bawah). Sertakan:
    1. Sinyal utama (buy/sell) dan alasan utamanya.
    2. Trend pasar dan pengaruhnya.
    3. Harga penting (current price, support, resistance, entry/SL/TP).
    4. Pola chart yang teridentifikasi.
    5. Strategi eksekusi (target profit, stop loss, waktu hold, tips eksekusi).
    6. (Opsional) Tips tambahan jika ada.
    7. Jika leverage > 20x, WAJIB beri peringatan risiko di reasoning.
- error: string (jika ada masalah)

JANGAN MENEBak. Jika data tidak jelas di chart, tulis dengan jujur: Unknown atau No clear pattern. Hanya berikan analisa berdasarkan bukti visual di chart.

Contoh JSON:
{
  "detectedTimeframe": "1H",
  "tradeType": "Short",
  "entryPrice": 21585.25,
  "stopLoss": 21571.45,
  "takeProfit": 21500.00,
  "leverage": 10,
  "profitAmount": 200,
  "tradeBias": "Bearish",
  "confidenceScore": 90,
  "marketTrend": "Bearish",
  "keyPattern": "Descending Triangle",
  "indicatorAnalysis": "RSI overbought, MFI menunjukkan penurunan momentum",
  "rationale": [
    "SELL signal berdasarkan kondisi pasar saat ini.",
    "Trend pasar secara keseluruhan adalah Bearish, mendukung bias sell.",
    "Harga saat ini di 21579.25 menunjukkan tekanan turun.",
    "Pola descending triangle teridentifikasi, biasanya mengindikasikan potensi penurunan.",
    "Support utama di 21571.45, resistance di 21585.25.",
    "Strategi: targetkan profit cepat dengan stop loss ketat, waktu hold singkat.",
    "Perhatikan volume jual dan pantulan dari resistance untuk timing entry optimal."
  ],
  "error": ""
}

Jawab HANYA dengan JSON valid. Bahasa Indonesia. Jangan gunakan confidenceScore 50 kecuali benar-benar tidak yakin sama sekali.`;
};


// Ganti analyzeChart agar pakai Gemini 1.5 Pro
export const analyzeChart = async (
    apiKey: string,
    imageFile: File,
    riskParams: RiskParameters,
    tradingMode: TradingMode,
    currentEquity: number
): Promise<{ analysis: Omit<TradeAnalysis, 'id' | 'timestamp' | 'image' | 'mode' | 'status'>, usage: TokenUsage }> => {
    if (!apiKey) {
        throw new Error("API key is not set.");
    }
    
    // Convert image to base64
    const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            try {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            } catch (error) {
                reject(new Error("Failed to process image file"));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(imageFile);
    });
    
    let lastError: Error | null = null;
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-latest", // UPDATED to the best available model
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    });

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: imageFile.type,
        },
    };

    // Retry up to 2 times with different prompts
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            let promptText: string;
            
            if (attempt === 1) {
                promptText = buildPrompt({ ...riskParams, currentEquity }, tradingMode);
            } else {
                // Enhanced retry prompt with technical focus
                promptText = `Anda adalah AI analis trading profesional. User memilih mode: ${modeDetails[tradingMode]}.
Analisa chart yang diupload dan berikan saran trading dalam format JSON BERDASARKAN APA YANG TERLIHAT JELAS DI CHART.

- detectedTimeframe: WAJIB diisi, timeframe chart yang terdeteksi dari gambar (misal: '1m', '5m', '15m', '1H', '4H', '1D', dst). Jika tidak yakin, tulis 'Unknown'.
- Pilih leverage sesuai aturan berikut:
  - Konservatif (Swing/jangka menengah): 1x–3x
  - Moderat (Day trading): 5x–10x
  - Agresif (Scalping/spekulatif): 10x–20x
  - Ekstrem (High risk, short-term): >20x (WAJIB beri peringatan risiko!)
- tradeType: 'Long' atau 'Short'
- entryPrice, stopLoss, takeProfit: angka valid
- leverage: pilih sesuai aturan di atas dan mode trading user
- profitAmount: WAJIB diisi, estimasi profit USD dari trade setup yang diberikan (boleh estimasi sederhana, tidak boleh kosong)
- tradeBias: WAJIB diisi, bias utama trade berdasarkan analisa chart (Bullish, Bearish, atau Neutral)
- confidenceScore: angka antara 70-100 (jika sinyal jelas dan setup valid), atau di bawah 70 hanya jika benar-benar ragu/tidak yakin.
- marketTrend: trend utama yang TERLIHAT JELAS (bullish, bearish, sideways, atau Unknown jika tidak jelas)
- keyPattern: pola utama (misal: double top, head and shoulders, dsb, atau No clear pattern jika tidak ada)
- indicatorAnalysis: analisa indikator utama (RSI, MACD, MFI, dsb, atau No indicator analysis jika tidak ada)
- rationale: reasoning trading profesional, WAJIB dalam bentuk array bullet point (minimal 5 poin, setiap poin actionable dan spesifik, seperti contoh di bawah). Sertakan:
    1. Sinyal utama (buy/sell) dan alasan utamanya.
    2. Trend pasar dan pengaruhnya.
    3. Harga penting (current price, support, resistance, entry/SL/TP).
    4. Pola chart yang teridentifikasi.
    5. Strategi eksekusi (target profit, stop loss, waktu hold, tips eksekusi).
    6. (Opsional) Tips tambahan jika ada.
    7. Jika leverage > 20x, WAJIB beri peringatan risiko di reasoning.
- error: string (jika ada masalah)

JANGAN MENEBak. Jika data tidak jelas di chart, tulis dengan jujur: Unknown atau No clear pattern. Hanya berikan analisa berdasarkan bukti visual di chart.

Contoh JSON:
{
  "detectedTimeframe": "1H",
  "tradeType": "Short",
  "entryPrice": 21585.25,
  "stopLoss": 21571.45,
  "takeProfit": 21500.00,
  "leverage": 10,
  "profitAmount": 200,
  "tradeBias": "Bearish",
  "confidenceScore": 90,
  "marketTrend": "Bearish",
  "keyPattern": "Descending Triangle",
  "indicatorAnalysis": "RSI overbought, MFI menunjukkan penurunan momentum",
  "rationale": [
    "SELL signal berdasarkan kondisi pasar saat ini.",
    "Trend pasar secara keseluruhan adalah Bearish, mendukung bias sell.",
    "Harga saat ini di 21579.25 menunjukkan tekanan turun.",
    "Pola descending triangle teridentifikasi, biasanya mengindikasikan potensi penurunan.",
    "Support utama di 21571.45, resistance di 21585.25.",
    "Strategi: targetkan profit cepat dengan stop loss ketat, waktu hold singkat.",
    "Perhatikan volume jual dan pantulan dari resistance untuk timing entry optimal."
  ],
  "error": ""
}

Jawab HANYA dengan JSON valid. Bahasa Indonesia. Jangan gunakan confidenceScore 50 kecuali benar-benar tidak yakin sama sekali.`;
            }
            
            console.log(`Attempt ${attempt}: Sending chart analysis request to Gemini 1.5 Pro...`);

            const systemInstruction = 'You are a professional trading analyst AI. You MUST respond with ONLY valid JSON format. Do not include any additional text, markdown formatting, or explanations outside the JSON structure. The response must be parseable JSON.';
            const fullPrompt = `${systemInstruction}\n\n${promptText}`;
            
            const result = await model.generateContent([fullPrompt, imagePart]);
            const response = result.response;
            let jsonString = response.text();
            
            console.log(`Attempt ${attempt}: Gemini 1.5 Pro response received:`, jsonString);

            const usage: TokenUsage = { prompt: 0, completion: 0, total: 0 };
            
            jsonString = jsonString.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
            
            let jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("No JSON object found in response");
                console.error("Full response:", jsonString);
                throw new Error("AI response does not contain valid JSON format");
            }
            
            jsonString = jsonMatch[0];
            console.log(`Attempt ${attempt}: Extracted JSON string:`, jsonString);
            
            let analysisData: any;
            try {
                analysisData = JSON.parse(jsonString);
            } catch (parseError) {
                console.error("JSON parsing failed:", parseError);
                console.error("Failed JSON string:", jsonString);
                throw new Error("AI response format is invalid. Please try again.");
            }

            if (!analysisData.tradeSetup && analysisData.tradeType && analysisData.entryPrice && analysisData.stopLoss && analysisData.takeProfit) {
                analysisData.tradeSetup = {
                    tradeType: analysisData.tradeType,
                    entryPrice: analysisData.entryPrice,
                    stopLoss: analysisData.stopLoss,
                    takeProfit: analysisData.takeProfit,
                    rrr: analysisData.rrr || 0
                };
            }
            
            console.log(`Attempt ${attempt}: Parsed analysis data:`, analysisData);
            
            if (!analysisData.tradeSetup && analysisData.tradeType && analysisData.entryPrice !== undefined && analysisData.stopLoss !== undefined && analysisData.takeProfit !== undefined) {
              analysisData.tradeSetup = {
                tradeType: analysisData.tradeType,
                entryPrice: analysisData.entryPrice,
                stopLoss: analysisData.stopLoss,
                takeProfit: analysisData.takeProfit,
                rrr: analysisData.rrr || 0
              };
              if (analysisData.leverage !== undefined) analysisData.leverage = analysisData.leverage;
              if (analysisData.profitAmount !== undefined) analysisData.profitAmount = analysisData.profitAmount;
              if (analysisData.rationale !== undefined) analysisData.rationale = analysisData.rationale;
              if (analysisData.error !== undefined) analysisData.error = analysisData.error;
            }
            
            const requiredFields = ['tradeSetup', 'marketTrend', 'tradeBias', 'confidenceScore', 'rationale', 'keyPattern', 'indicatorAnalysis'];
            const missingFields = requiredFields.filter(field => analysisData[field] === undefined || analysisData[field] === null);
            
            console.log(`Attempt ${attempt}: Full AI response:`, analysisData);
            
            if (analysisData && analysisData.error && analysisData.error.trim() !== "") {
              return {
                analysis: { error: analysisData.error } as any,
                usage
              };
            }
            
            if (missingFields.length > 0) {
                console.error(`Attempt ${attempt}: Missing required fields in analysis data:`, missingFields);
                console.error("Available fields:", Object.keys(analysisData));
                console.error("Analysis data:", analysisData);
                
                const fallbackData = {
                    marketTrend: analysisData.marketTrend || "Unknown",
                    keyPattern: analysisData.keyPattern || "No clear pattern",
                    indicatorAnalysis: analysisData.indicatorAnalysis || "No indicator analysis",
                    tradeBias: analysisData.tradeBias || "Neutral",
                    confidenceScore: analysisData.confidenceScore || 50,
                    rationale: analysisData.rationale || "Analysis incomplete due to missing data",
                    tradeSetup: analysisData.tradeSetup || {
                        tradeType: "Long",
                        entryPrice: "0",
                        stopLoss: "0", 
                        takeProfit: "0",
                        rrr: 1
                    }
                };
                
                if (fallbackData.tradeSetup && !fallbackData.tradeSetup.tradeType) {
                    fallbackData.tradeSetup.tradeType = "Long";
                }
                
                const confidenceScore = analysisData.confidenceScore || 0;
                const tradeSetup = analysisData.tradeSetup || {};
                const rrr = parseFloat(tradeSetup.rrr) || 0;
                
                if (confidenceScore >= 70 && rrr > 0) {
                    console.log(`Attempt ${attempt}: High-confidence signal detected (${confidenceScore}%, RRR: ${rrr})`);
                } else {
                    console.warn(`Attempt ${attempt}: Low-confidence signal (${confidenceScore}%, RRR: ${rrr}) - Consider retrying`);
                }
                
                const criticalFields = ['tradeSetup'];
                const criticalMissing = criticalFields.filter(field => !analysisData[field]);
                
                if (criticalMissing.length > 0) {
                    throw new Error(`AI response is incomplete. Missing critical fields: ${criticalMissing.join(', ')}`);
                }
                
                console.log(`Attempt ${attempt}: Using fallback data for missing fields:`, fallbackData);
                analysisData = { ...analysisData, ...fallbackData };
            }
            
            if (typeof analysisData.riskPerTrade !== 'number' || isNaN(analysisData.riskPerTrade)) {
                console.warn('AI response missing riskPerTrade, fallback to 1.0%');
                analysisData.riskPerTrade = 1.0;
            }
            
            const validTradeTypes = ['Long', 'Short'];
            const requiredTradeSetupFields = ['tradeType', 'entryPrice', 'stopLoss', 'takeProfit'];
            const missingTradeSetupFields = requiredTradeSetupFields.filter(field => {
                const value = analysisData.tradeSetup[field];
                if (field === 'tradeType') return !value || (value !== 'Long' && value !== 'Short');
                return value === undefined || value === null || value === '' || Number(value) === 0 || isNaN(Number(value));
            });
            
            if (missingTradeSetupFields.length > 0) {
                console.error("Missing required tradeSetup fields:", missingTradeSetupFields);
                console.error("Available tradeSetup fields:", Object.keys(analysisData.tradeSetup));
                console.error("TradeSetup data:", analysisData.tradeSetup);
                throw new Error(`Trade setup data is incomplete. Missing fields: ${missingTradeSetupFields.join(', ')}`);
            }
            
            if (!analysisData.tradeSetup || typeof analysisData.tradeSetup !== 'object') {
                console.error("tradeSetup is missing or not an object:", analysisData.tradeSetup);
                throw new Error("Trade setup data is missing or invalid");
            }
            
            analysisData.confidenceScore = Number(analysisData.confidenceScore) || 50;
            if (analysisData.confidenceScore < 0 || analysisData.confidenceScore > 100) {
                analysisData.confidenceScore = 50;
            }

            if (analysisData.tradeSetup && analysisData.tradeSetup.tradeType === 'Neutral') {
              analysisData.confidenceScore = Math.min(analysisData.confidenceScore || 50, 50);
            }
            
            if (!analysisData.tradeBias || !['Bullish', 'Bearish', 'Neutral'].includes(analysisData.tradeBias)) {
                analysisData.tradeBias = 'Neutral';
            }
            
            if (analysisData.tradeSetup.tradeType) {
                const tradeType = String(analysisData.tradeSetup.tradeType).trim().toLowerCase();
                if (tradeType === 'long' || tradeType === 'short') {
                    analysisData.tradeSetup.tradeType = tradeType.charAt(0).toUpperCase() + tradeType.slice(1);
                } else {
                    console.warn('Invalid tradeType, fallback to Long');
                    analysisData.tradeSetup.tradeType = 'Long';
                }
            } else {
                console.warn('Missing tradeType, fallback to Long');
                analysisData.tradeSetup.tradeType = 'Long';
            }
            
            if (analysisData.tradeSetup) {
                analysisData.tradeSetup.entryPrice = Number(analysisData.tradeSetup.entryPrice) || 0;
                analysisData.tradeSetup.stopLoss = Number(analysisData.tradeSetup.stopLoss) || 0;
                analysisData.tradeSetup.takeProfit = Number(analysisData.tradeSetup.takeProfit) || 0;
                analysisData.tradeSetup.rrr = Number(analysisData.tradeSetup.rrr) || 1;
            }
            
            console.log(`Attempt ${attempt}: Analysis successful!`);

            function mapTimeframeToMode(tf: string | undefined) {
              if (!tf) return 'unknown';
              const tfTrim = String(tf).trim();
              if (tfTrim === "1M") return "position"; 
              const tfStr = tfTrim.toLowerCase();
              if (["1m", "3m", "5m", "15m"].includes(tfStr)) return "scalp";
              if (["30m"].includes(tfStr)) return "day";
              if (["1h", "2h", "4h", "12h"].includes(tfStr)) return "swing";
              if (["1d", "1w"].includes(tfStr)) return "position";
              return "unknown";
            }

            const detectedMode = mapTimeframeToMode(analysisData.detectedTimeframe);
            return {
              analysis: {
                ...analysisData,
                mode: detectedMode
              },
              usage
            };

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (attempt < 3) {
                console.log(`Retrying with enhanced prompt... (attempt ${attempt + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    console.error("All analysis attempts failed");
    const warningMsg = `AI analysis failed after all attempts. Last error: ${lastError?.message || lastError}`;
    throw new Error(warningMsg);
};

export type MinimalTrade = {
  id: string;
  timestamp: string;
  mode: TradingMode;
  status: 'pending' | 'profit' | 'stop-loss';
  outcomeAmount?: number;
};

// Ubah analyzePerformance agar request ke Gemini 1.5 Pro
export const analyzePerformance = async (apiKey: string, prompt: string): Promise<{ analysisText: string, usage: TokenUsage }> => {
    if (!apiKey) throw new Error("API key is not set.");
    
    try {
        console.log("Sending performance analysis request to Gemini 1.5 Pro...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); // UPDATED

        const systemInstruction = 'You are a professional trading performance coach.';
        const fullPrompt = `${systemInstruction}\n\n${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const analysisText = response.text();
        
        console.log("Gemini 1.5 Pro performance response received:", analysisText);
        
        const usage: TokenUsage = { prompt: 0, completion: 0, total: 0 };
        
        return { analysisText, usage };
    } catch (error) {
        console.error("Error in analyzePerformance:", error);
        throw error;
    }
};

// Ubah generateFinancialAdvice agar request ke Gemini 1.5 Pro
export const generateFinancialAdvice = async (apiKey: string, portfolio: PortfolioData | null, userQuery: string): Promise<{ analysisText: string, usage: TokenUsage }> => {
    if (!apiKey) throw new Error("API key is not set.");
    if (!portfolio) throw new Error("Portfolio data is not available.");
    
    const systemInstruction = `
        You are an AI financial assistant. Your role is to provide educational and general analysis of a user's investment portfolio.
        - NEVER give direct financial advice or recommendations to buy or sell any asset.
        - ALWAYS be neutral, prudent, and focus on general financial principles, risk management, and diversification.
        - You can explain concepts, analyze the current state of the portfolio, and discuss general strategies, but do not make predictions or recommendations.
        - ALWAYS include a disclaimer at the end of every response, formatted in Markdown as a blockquote, stating: "This information is for educational purposes only and is not financial advice. All investments involve risk. Consult with a qualified financial advisor before making any decisions."
        - Keep your responses concise and easy to understand.
        - Jawab seluruh analisis, penjelasan, dan saran ini dalam bahasa Indonesia yang jelas dan mudah dipahami.
    `;
    
    const userPrompt = `
        Berikut adalah data portofolio pengguna:
        ${JSON.stringify(portfolio, null, 2)}

        Pengguna memiliki pertanyaan berikut: "${userQuery}"

        Berikan analisis dan penjelasan yang bersifat edukatif dan umum berdasarkan portofolio dan pertanyaan pengguna, sesuai instruksi sistem di atas. Jangan memberikan saran spesifik untuk membeli atau menjual aset apapun. Jawab seluruh analisis, penjelasan, dan saran ini dalam bahasa Indonesia yang jelas dan mudah dipahami.
    `;
    
    try {
        console.log("Sending financial advice request to Gemini 1.5 Pro...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" }); // UPDATED

        const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const analysisText = response.text();

        console.log("Gemini 1.5 Pro financial advice response received:", analysisText);
        
        const usage: TokenUsage = { prompt: 0, completion: 0, total: 0 };
        
        return { analysisText, usage };
    } catch (error) {
        console.error("Error in generateFinancialAdvice:", error);
        throw error;
    }
};

// Ubah verifyApiKey agar menggunakan model yang cepat dan hemat biaya
export const verifyApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use a fast and cost-effective model for verification
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // UPDATED
        
        // Make a simple, low-cost call to check if the key is valid
        await model.generateContent("test");
        
        return true;
    } catch (error) {
        console.error("API Key validation failed:", error);
        return false;
    }
};