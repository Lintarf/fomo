import { createClient, SupabaseClient, Session, AuthError } from '@supabase/supabase-js';
import { TradeAnalysis, TradingMode, TradeSetup, PortfolioData, Asset } from '../types';

/**
 * The `Json` type from Supabase can cause issues with deep type instantiation,
 * leading to "Type instantiation is excessively deep" errors.
 * Using 'any' for the JSON type is a pragmatic solution to avoid these
 * complex type errors while keeping changes minimal and contained.
 */
export type Json = any;


// IMPORTANT: Replace with your actual Supabase project URL and Anon Key.
// It's recommended to use environment variables for this in a real project.
const SUPABASE_URL = 'https://vqzivktsvicvbdsuouap.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-4ZuY1Bk4XaOCDxrvymo9A_plFhPgFz';

export type Database = {
  public: {
    Tables: {
      settings: {
        Row: {
          id: number
          created_at: string
          gemini_api_key: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          gemini_api_key?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          gemini_api_key?: string | null
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          created_at: string
          image: string
          mode: TradingMode
          market_trend: string
          key_pattern: string
          indicator_analysis: string
          trade_bias: string
          trade_setup: Json
          rationale: string
          confidence_score: number
          status: 'pending' | 'profit' | 'stop-loss'
          outcome_amount: number | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          image: string
          mode: TradingMode
          market_trend: string
          key_pattern: string
          indicator_analysis: string
          trade_bias: string
          trade_setup: Json
          rationale: string
          confidence_score: number
          status: 'pending' | 'profit' | 'stop-loss'
          outcome_amount?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          image?: string
          mode?: TradingMode
          market_trend?: string
          key_pattern?: string
          indicator_analysis?: string
          trade_bias?: string
          trade_setup?: Json
          rationale?: string
          confidence_score?: number
          status?: 'pending' | 'profit' | 'stop-loss'
          outcome_amount?: number | null
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          nama: string | null
          initial_trade: number | null
          describe: string | null
          tier: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          nama?: string | null
          initial_trade?: number | null
          describe?: string | null
          tier?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          nama?: string | null
          initial_trade?: number | null
          describe?: string | null
          tier?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

const createErrorString = (context: string, table: string, error: any): string => {
  const baseMessage = `There was a problem trying to ${context} data for the '${table}' table.`;

  const getMessageString = (err: any): string => {
    if (!err) return 'Unknown error: The error object was falsy.';
    if (typeof err.message === 'string' && err.message) return err.message;
    // Handle cases where `message` might be an object
    if (typeof err.message === 'object' && err.message !== null) return JSON.stringify(err.message, null, 2);
    // Fallback to stringifying the whole error
    if (typeof err === 'object' && err !== null) return JSON.stringify(err, null, 2);
    return String(err);
  };

  const errorMessage = getMessageString(error);

  if (errorMessage.toLowerCase().includes('column "user_id" does not exist') || errorMessage.toLowerCase().includes('column trades.user_id does not exist')) {
    const sqlFixMessage = `
**Database Schema Mismatch Detected!**

The application code has been updated to support multiple users, which requires a \`user_id\` column in the \`trades\` table. This column is missing in your database.

---
**How to Fix It:**

You need to run the following SQL commands in your Supabase SQL Editor to update your table structure and enable security policies.

1.  Go to your **Supabase Dashboard**.
2.  Navigate to the **SQL Editor**.
3.  Click **+ New query**.
4.  Copy and paste the entire block of SQL code below and click **RUN**.

---
**SQL Code to Run:**

-- Step 1: Add the user_id column to the trades table
ALTER TABLE public.trades
ADD COLUMN user_id UUID;

-- Step 2: Add a foreign key constraint to link it to auth.users
-- This ensures data integrity and automatically deletes a user's trades if they are deleted.
ALTER TABLE public.trades
ADD CONSTRAINT trades_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Enable Row Level Security on the table
-- This is a critical security step to ensure users can only see their own data.
ALTER TABLE public.trades
ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies to control access
-- Policy to allow users to view their own trades
CREATE POLICY "Allow users to read their own trades"
ON public.trades
FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own trades
CREATE POLICY "Allow users to insert their own trades"
ON public.trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own trades
CREATE POLICY "Allow users to update their own trades"
ON public.trades
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- (Optional) If you have existing trades, you might want to assign them to your user ID.
-- Find your user ID in Project Settings > Authentication > Users.
-- UPDATE public.trades SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
---
`;
    return sqlFixMessage;
  }

  if (errorMessage.toLowerCase().includes('failed to fetch')) {
    const corsMessage = `
This is a "Failed to fetch" network error, which is almost always a Cross-Origin Resource Sharing (CORS) configuration issue.

Your web browser is blocking requests to Supabase for security reasons.

---
**How to Fix It:**

You need to add this application's URL to the list of allowed origins in your Supabase project.

1.  **Copy your application's URL** from your browser's address bar.
2.  Go to your **Supabase Dashboard**.
3.  Navigate to **Project Settings > API**.
4.  Find the **CORS Configuration** section.
5.  Add your application's URL as a new origin pattern.
6.  **Save** the changes in Supabase and **refresh this page**.
---
`;
    return `${baseMessage}\n\n${corsMessage}`;
  }

  // Fallback for other errors, like RLS
  const rlsHint = `This could be due to a network connectivity issue or a restrictive Row Level Security (RLS) policy on the '${table}' table. Please check your RLS policies to ensure the requested data can be accessed.`;
  return `${baseMessage}\n\n${rlsHint}\n\nTechnical Details:\n${errorMessage}`;
};


export const createSupabaseClient = (): SupabaseClient<Database> | null => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('your-project-id')) {
        console.error("Supabase URL or Key is not configured. Please update it in services/supabaseService.ts");
        return null;
    }
    try {
        return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error("Error creating Supabase client:", error);
        return null;
    }
};

export const signUpUser = async (client: SupabaseClient<Database>, { email, password, nama }: { email: string; password: string; nama: string; }) => {
    // The user's profile will be created automatically by a database trigger
    // that fires after a new user is inserted into `auth.users`.
    // We pass the user's name in the `data` option, which is stored in `raw_user_meta_data`.
    const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                nama: nama
            }
        }
    });

    if (error) {
        if (error.message.toLowerCase().includes("user already registered")) {
            throw new Error("A user with this email address already exists. Please try logging in.");
        }
        console.error("Supabase sign-up error:", error);
        throw new Error(`Failed to sign up: ${error.message}`);
    }

    // The onAuthStateChange listener in App.tsx will handle the session.
    // If "Confirm email" is turned on, the user won't be signed in until they confirm.
    // If it's off, they will be signed in immediately.
    return data;
};

export const signInWithPassword = async (client: SupabaseClient<Database>, {email, password}: {email: string; password: string;}) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export const signOut = async (client: SupabaseClient<Database>) => {
    const { error } = await client.auth.signOut();
    if (error) throw error;
}

export const onAuthStateChange = (client: SupabaseClient<Database>, callback: (session: Session | null) => void) => {
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
    return subscription;
}

export const getUserProfile = async (client: SupabaseClient<Database>, userId: string): Promise<Database['public']['Tables']['users']['Row'] | null> => {
    try {
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            // 'PGRST116' is the code for "The result contains 0 rows"
            if (error.code === 'PGRST116') {
                console.warn(`No profile found for user ${userId}. A new one may need to be created if this is unexpected.`);
                return null;
            }
            throw error;
        }
        return data;
    } catch(err) {
        const errorMessage = createErrorString(`fetch profile for user ${userId}`, 'users', err);
        console.error(errorMessage);
        // Don't re-throw, so the app doesn't crash if a profile is missing.
        return null;
    }
};


export const getTrades = async (client: SupabaseClient<Database>, userId: string): Promise<TradeAnalysis[]> => {
    const { data, error } = await client
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        const errorMessage = createErrorString('fetch', 'trades', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    return (data || []).map((trade): TradeAnalysis => ({
        id: trade.id,
        timestamp: trade.created_at,
        image: trade.image,
        mode: trade.mode,
        marketTrend: trade.market_trend,
        keyPattern: trade.key_pattern,
        indicatorAnalysis: trade.indicator_analysis,
        tradeBias: trade.trade_bias,
        tradeSetup: trade.trade_setup as unknown as TradeSetup,
        rationale: trade.rationale,
        confidenceScore: trade.confidence_score,
        status: trade.status,
        outcomeAmount: trade.outcome_amount ?? undefined,
    }));
};

export const updateUserInitialCapital = async (client: SupabaseClient<Database>, userId: string, capital: number): Promise<void> => {
    const { error } = await client
        .from('users')
        .update({ initial_trade: capital })
        .eq('id', userId);

    if (error) {
        const errorMessage = createErrorString(`update initial capital for user ${userId}`, 'users', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

export const updateUserProfile = async (client: SupabaseClient<Database>, userId: string, name: string, description: string): Promise<void> => {
    const { error } = await client
        .from('users')
        .update({ nama: name, describe: description })
        .eq('id', userId);

    if (error) {
        const errorMessage = createErrorString(`update profile for user ${userId}`, 'users', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

export const addTrade = async (client: SupabaseClient<Database>, trade: Omit<TradeAnalysis, 'id' | 'timestamp'> & { mode: TradingMode }, userId: string): Promise<TradeAnalysis> => {
    const tradeForDb: Database['public']['Tables']['trades']['Insert'] = {
        user_id: userId,
        image: trade.image,
        mode: trade.mode,
        market_trend: trade.marketTrend,
        key_pattern: trade.keyPattern,
        indicator_analysis: trade.indicatorAnalysis,
        trade_bias: trade.tradeBias,
        trade_setup: trade.tradeSetup as unknown as Json,
        rationale: trade.rationale,
        confidence_score: trade.confidenceScore,
        status: trade.status,
        outcome_amount: trade.outcomeAmount ?? null,
    };

    const { data, error } = await client
        .from('trades')
        .insert(tradeForDb)
        .select()
        .single();

    if (error) {
        const errorMessage = createErrorString('add', 'trades', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    if (!data) {
        throw new Error("Failed to add trade: no data returned.");
    }
    
    const newTrade = data;
    return {
        id: newTrade.id,
        timestamp: newTrade.created_at,
        image: newTrade.image,
        mode: newTrade.mode,
        marketTrend: newTrade.market_trend,
        keyPattern: newTrade.key_pattern,
        indicatorAnalysis: newTrade.indicator_analysis,
        tradeBias: newTrade.trade_bias,
        tradeSetup: newTrade.trade_setup as unknown as TradeSetup,
        rationale: newTrade.rationale,
        confidenceScore: newTrade.confidence_score,
        status: newTrade.status,
        outcomeAmount: newTrade.outcome_amount ?? undefined,
    };
};

export const updateTradeStatus = async (client: SupabaseClient<Database>, tradeId: string, status: 'profit' | 'stop-loss', outcomeAmount: number, userId: string): Promise<void> => {
    const { error } = await client
        .from('trades')
        .update({ status, outcome_amount: outcomeAmount })
        .eq('id', tradeId)
        .eq('user_id', userId);
        
    if (error) {
        const errorMessage = createErrorString(`update status for trade ${tradeId}`, 'trades', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

export const deleteTrade = async (client: SupabaseClient<Database>, tradeId: string, userId: string): Promise<void> => {
    const { error } = await client
        .from('trades')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', userId);
        
    if (error) {
        const errorMessage = createErrorString(`delete trade ${tradeId}`, 'trades', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

/**
 * In a real-world application, this function would fetch asset data from a dedicated `assets` table in Supabase.
 * To provide a functional and rich demonstration without requiring users to set up a new table,
 * this function simulates that process by returning a hardcoded, realistic-looking portfolio.
 * The prices are randomized slightly on each call to simulate market volatility.
 */
export const getPortfolioData = async (userId: string): Promise<PortfolioData> => {
    // Simulate API call latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Hardcoded mock data - this would be fetched from the database
    const mockAssets = [
        { symbol: "BTC", name: "Bitcoin", logoUrl: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25668/svg/color/btc.svg", amount: 0.75, avgBuyPrice: 45000 },
        { symbol: "ETH", name: "Ethereum", logoUrl: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25668/svg/color/eth.svg", amount: 15, avgBuyPrice: 3000 },
        { symbol: "SOL", name: "Solana", logoUrl: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25668/svg/color/sol.svg", amount: 250, avgBuyPrice: 100 },
        { symbol: "ADA", name: "Cardano", logoUrl: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25668/svg/color/ada.svg", amount: 10000, avgBuyPrice: 0.85 },
        { symbol: "XAU", name: "Gold Spot", logoUrl: "https://img.icons8.com/fluency/48/gold-bars.png", amount: 5, avgBuyPrice: 2050 },
    ];

    let totalValue = 0;
    let totalPl = 0;
    let total24hValueChange = 0;

    const assets: Asset[] = mockAssets.map(asset => {
        // Simulate price volatility (+/- 5%)
        const priceVolatility = (Math.random() - 0.5) * 0.1; 
        const currentPrice = asset.avgBuyPrice * (1 + priceVolatility);
        
        // Simulate 24h price change (+/- 2%)
        const price24hAgo = currentPrice / (1 + (Math.random() - 0.5) * 0.04);

        const value = asset.amount * currentPrice;
        const totalPlForAsset = (currentPrice - asset.avgBuyPrice) * asset.amount;
        
        const value24hAgo = asset.amount * price24hAgo;
        const pl24hForAsset = value - value24hAgo;

        totalValue += value;
        totalPl += totalPlForAsset;
        total24hValueChange += pl24hForAsset;

        return {
            ...asset,
            currentPrice,
            value,
            totalPl: totalPlForAsset,
        };
    });
    
    const totalValue24hAgo = totalValue - total24hValueChange;
    const pl24hPercent = totalValue24hAgo > 0 ? (total24hValueChange / totalValue24hAgo) * 100 : 0;

    return {
        assets,
        totalValue,
        totalPl,
        pl24h: total24hValueChange,
        pl24hPercent,
    };
};

export const getSettings = async (client: SupabaseClient<Database>): Promise<{ gemini_api_key: string | null } | null> => {
    try {
        const { data, error } = await client
            .from('settings')
            .select('gemini_api_key')
            .eq('id', 1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.warn("No settings found in the database. A new settings row may need to be created.");
                return null;
            }
            throw error;
        }
        return data;
    } catch (err) {
        const errorMessage = createErrorString('fetch', 'settings', err);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

export const updateGeminiKey = async (client: SupabaseClient<Database>, apiKey: string): Promise<void> => {
    const { error } = await client
        .from('settings')
        .update({ gemini_api_key: apiKey })
        .eq('id', 1);

    if (error) {
        const errorMessage = createErrorString('update Gemini API key in', 'settings', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};