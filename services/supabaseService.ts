import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { TradeAnalysis, TradingMode, TradeSetup, PortfolioData, Asset, CommunityAnalysis, CommunityComment, CommunityStats } from '../types';

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
      portfolio_assets: {
        Row: {
          id: string
          user_id: string
          symbol: string
          name: string
          logo_url: string
          amount: number
          avg_buy_price: number
          current_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          name: string
          logo_url?: string
          amount?: number
          avg_buy_price?: number
          current_price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          name?: string
          logo_url?: string
          amount?: number
          avg_buy_price?: number
          current_price?: number
          created_at?: string
          updated_at?: string
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
      community_analyses: {
        Row: {
          id: string
          user_id: string
          analysis_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
          likes_count: number
          dislikes_count: number
          comments_count: number
          is_featured: boolean
        }
        Insert: {
          id?: string
          user_id: string
          analysis_id: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
          comments_count?: number
          is_featured?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          analysis_id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          likes_count?: number
          dislikes_count?: number
          comments_count?: number
          is_featured?: boolean
        }
      }
      community_comments: {
        Row: {
          id: string
          user_id: string
          analysis_id: string
          content: string
          created_at: string
          updated_at: string
          user_email: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_id: string
          content: string
          created_at?: string
          updated_at?: string
          user_email?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_email?: string
        }
      }
      community_likes: {
        Row: {
          id: string
          user_id: string
          analysis_id: string
          like_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_id: string
          like_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_id?: string
          like_type?: string
          created_at?: string
        }
      }
      user_community_reads: {
        Row: {
          id: string
          user_id: string
          last_read_at: string
        }
        Insert: {
          id?: string
          user_id: string
          last_read_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          last_read_at?: string
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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { supabase };

export const signUpUser = async (client: SupabaseClient<Database>, { email, password, nama }: { email: string; password: string; nama: string; }) => {
    try {
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

        // If email confirmation is required, show a message
        if (data.user && !data.session) {
            throw new Error("Please check your email to confirm your account before signing in.");
        }

        // The onAuthStateChange listener in App.tsx will handle the session.
        // If "Confirm email" is turned on, the user won't be signed in until they confirm.
        // If it's off, they will be signed in immediately.
        return data;
    } catch (error) {
        console.error("Sign up error:", error);
        throw error;
    }
};

export const signInWithPassword = async (client: SupabaseClient<Database>, {email, password}: {email: string; password: string;}) => {
    try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        
        if (error) {
            console.error("Sign in error:", error);
            
            // Provide user-friendly error messages
            if (error.message.toLowerCase().includes("invalid login credentials")) {
                throw new Error("Invalid email or password. Please check your credentials and try again.");
            } else if (error.message.toLowerCase().includes("email not confirmed")) {
                throw new Error("Please check your email and confirm your account before signing in.");
            } else if (error.message.toLowerCase().includes("too many requests")) {
                throw new Error("Too many login attempts. Please wait a moment before trying again.");
            } else {
                throw new Error(`Sign in failed: ${error.message}`);
            }
        }
        
        return data;
    } catch (error) {
        console.error("Sign in error:", error);
        throw error;
    }
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
        tradeSetup: {
            tradeType: (trade.trade_setup as any)?.tradeType || 'Long',
            entryPrice: Number((trade.trade_setup as any)?.entryPrice) || 0,
            stopLoss: Number((trade.trade_setup as any)?.stopLoss) || 0,
            takeProfit: Number((trade.trade_setup as any)?.takeProfit) || 0,
            rrr: Number((trade.trade_setup as any)?.rrr) || 0
        },
        rationale: trade.rationale,
        confidenceScore: trade.confidence_score,
        status: trade.status,
        outcomeAmount: trade.outcome_amount ?? undefined,
        riskPerTrade: 0, // Default value, should be calculated based on trade setup
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
        tradeSetup: {
            tradeType: (newTrade.trade_setup as any)?.tradeType || 'Long',
            entryPrice: Number((newTrade.trade_setup as any)?.entryPrice) || 0,
            stopLoss: Number((newTrade.trade_setup as any)?.stopLoss) || 0,
            takeProfit: Number((newTrade.trade_setup as any)?.takeProfit) || 0,
            rrr: Number((newTrade.trade_setup as any)?.rrr) || 0
        },
        rationale: newTrade.rationale,
        confidenceScore: newTrade.confidence_score,
        status: newTrade.status,
        outcomeAmount: newTrade.outcome_amount ?? undefined,
        riskPerTrade: 0, // Default value, should be calculated based on trade setup
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

export const deleteTradeAnalysis = async (id: string) => {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Portfolio Asset Management Functions
export const getPortfolioAssets = async (client: SupabaseClient<Database>, userId: string): Promise<Database['public']['Tables']['portfolio_assets']['Row'][]> => {
    const { data, error } = await client
        .from('portfolio_assets')
        .select('*')
        .eq('user_id', userId)
        .order('symbol', { ascending: true });

    if (error) {
        const errorMessage = createErrorString('fetch portfolio assets', 'portfolio_assets', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    return data || [];
};

export const addPortfolioAsset = async (client: SupabaseClient<Database>, asset: {
    symbol: string;
    name: string;
    logo_url?: string;
    amount: number;
    avg_buy_price: number;
    current_price: number;
}, userId: string): Promise<Database['public']['Tables']['portfolio_assets']['Row']> => {
    const assetForDb: Database['public']['Tables']['portfolio_assets']['Insert'] = {
        user_id: userId,
        symbol: asset.symbol,
        name: asset.name,
        logo_url: asset.logo_url || '',
        amount: asset.amount,
        avg_buy_price: asset.avg_buy_price,
        current_price: asset.current_price,
    };

    const { data, error } = await client
        .from('portfolio_assets')
        .insert(assetForDb)
        .select()
        .single();

    if (error) {
        const errorMessage = createErrorString('add portfolio asset', 'portfolio_assets', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    if (!data) {
        throw new Error("Failed to add portfolio asset: no data returned.");
    }

    return data;
};

export const updatePortfolioAsset = async (client: SupabaseClient<Database>, assetId: string, updates: {
    amount?: number;
    avg_buy_price?: number;
    current_price?: number;
    logo_url?: string;
}, userId: string): Promise<void> => {
    const { error } = await client
        .from('portfolio_assets')
        .update(updates)
        .eq('id', assetId)
        .eq('user_id', userId);

    if (error) {
        const errorMessage = createErrorString(`update portfolio asset ${assetId}`, 'portfolio_assets', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

export const deletePortfolioAsset = async (client: SupabaseClient<Database>, assetId: string, userId: string): Promise<void> => {
    const { error } = await client
        .from('portfolio_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', userId);

    if (error) {
        const errorMessage = createErrorString(`delete portfolio asset ${assetId}`, 'portfolio_assets', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

/**
 * Fetch portfolio data from the database and calculate portfolio metrics
 */
export const getPortfolioData = async (client: SupabaseClient<Database>, userId: string): Promise<PortfolioData> => {
    try {
        const portfolioAssets = await getPortfolioAssets(client, userId);
        
        let totalValue = 0;
        let totalPl = 0;
        let total24hValueChange = 0;

        const assets: Asset[] = portfolioAssets.map(asset => {
            // Simulate 24h price change (+/- 2%) for demonstration
            const price24hAgo = asset.current_price / (1 + (Math.random() - 0.5) * 0.04);

            const value = asset.amount * asset.current_price;
            const totalPlForAsset = (asset.current_price - asset.avg_buy_price) * asset.amount;
            
            const value24hAgo = asset.amount * price24hAgo;
            const pl24hForAsset = value - value24hAgo;

            totalValue += value;
            totalPl += totalPlForAsset;
            total24hValueChange += pl24hForAsset;

            return {
                id: asset.id,
                symbol: asset.symbol,
                name: asset.name,
                logoUrl: asset.logo_url,
                amount: asset.amount,
                avgBuyPrice: asset.avg_buy_price,
                currentPrice: asset.current_price,
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
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
        // Return empty portfolio if there's an error
        return {
            assets: [],
            totalValue: 0,
            totalPl: 0,
            pl24h: 0,
            pl24hPercent: 0,
        };
    }
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

// Community Service Functions
export const shareAnalysis = async (client: SupabaseClient<Database>, analysisId: string, title: string, userId: string, description?: string): Promise<CommunityAnalysis> => {
    // Check if analysis is already shared by this user
    const alreadyShared = await checkIfAnalysisShared(client, userId, analysisId);
    
    if (alreadyShared) {
        console.log('Analysis already shared by user, updating existing share');
        
        // Update existing share
        const { data, error } = await client
            .from('community_analyses')
            .update({
                title,
                description,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('analysis_id', analysisId)
            .select()
            .single();

        if (error) {
            const errorMessage = createErrorString('update existing community analysis', 'community_analyses', error);
            console.error('Error updating existing share:', errorMessage);
            throw new Error(errorMessage);
        }

        console.log('Successfully updated existing share:', data);
        return data;
    }

    // Create new share
    const { data, error } = await client
        .from('community_analyses')
        .insert({
            user_id: userId,
            analysis_id: analysisId,
            title,
            description
        })
        .select()
        .single();

    if (error) {
        const errorMessage = createErrorString('share analysis', 'community_analyses', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    return data;
};

export const getCommunityAnalyses = async (client: SupabaseClient<Database>, limit = 20, offset = 0): Promise<CommunityAnalysis[]> => {
    console.log('Fetching community analyses with limit:', limit, 'offset:', offset);
    
    const { data, error } = await client
        .from('community_analyses')
        .select(`
            *,
            auth_users!inner(email),
            trades:analysis_id(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        const errorMessage = createErrorString('fetch community analyses', 'community_analyses', error);
        console.error('Error fetching community analyses:', errorMessage);
        throw new Error(errorMessage);
    }

    console.log('Raw community analyses data:', data);
    
    const processedData = data?.map(item => ({
        ...item,
        user_email: item.auth_users?.email,
        trade_analysis: item.trades
    })) || [];
    
    console.log('Processed community analyses:', processedData);
    return processedData;
};

export const addComment = async (client: SupabaseClient<Database>, analysisId: string, content: string, userId: string): Promise<CommunityComment> => {
    // Ambil email user yang sedang login
    const { data: { user } } = await client.auth.getUser();
    const userEmail = user?.email || 'Unknown User';

    const commentData = {
        user_id: userId,
        analysis_id: analysisId,
        content: content,
        user_email: userEmail
    };

    const { data, error } = await client
        .from('community_comments')
        .insert(commentData)
        .select()
        .single();

    if (error) {
        const errorMessage = createErrorString('add comment', 'community_comments', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    if (!data) {
        throw new Error("Failed to add comment: no data returned.");
    }

    return data;
};

export const getComments = async (client: SupabaseClient<Database>, analysisId: string): Promise<CommunityComment[]> => {
    const { data: comments, error: commentsError } = await client
        .from('community_comments')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: true });

    if (commentsError) {
        const errorMessage = createErrorString('fetch comments', 'community_comments', commentsError);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    return comments || [];
};

export const toggleLike = async (client: SupabaseClient<Database>, analysisId: string, likeType: 'like' | 'dislike', userId: string): Promise<void> => {
    // Check if user already liked/disliked
    const { data: existingLike } = await client
        .from('community_likes')
        .select('*')
        .eq('user_id', userId)
        .eq('analysis_id', analysisId)
        .single();

    if (existingLike) {
        if (existingLike.like_type === likeType) {
            // Remove like/dislike if same type
            const { error } = await client
                .from('community_likes')
                .delete()
                .eq('id', existingLike.id);
            
            if (error) {
                const errorMessage = createErrorString('remove like', 'community_likes', error);
                console.error(errorMessage);
                throw new Error(errorMessage);
            }
        } else {
            // Update like/dislike type
            const { error } = await client
                .from('community_likes')
                .update({ like_type: likeType })
                .eq('id', existingLike.id);
            
            if (error) {
                const errorMessage = createErrorString('update like', 'community_likes', error);
                console.error(errorMessage);
                throw new Error(errorMessage);
            }
        }
    } else {
        // Add new like/dislike
        const { error } = await client
            .from('community_likes')
            .insert({
                user_id: userId,
                analysis_id: analysisId,
                like_type: likeType
            });
        
        if (error) {
            const errorMessage = createErrorString('add like', 'community_likes', error);
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
};

export const getUserLike = async (client: SupabaseClient<Database>, analysisId: string, userId: string): Promise<'like' | 'dislike' | null> => {
    const { data, error } = await client
        .from('community_likes')
        .select('like_type')
        .eq('user_id', userId)
        .eq('analysis_id', analysisId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        const errorMessage = createErrorString('fetch user like', 'community_likes', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    return data?.like_type as 'like' | 'dislike' | null;
};

export const updateUserCommunityRead = async (client: SupabaseClient<Database>, userId: string): Promise<void> => {
    const { error } = await client
        .from('user_community_reads')
        .upsert([
            {
                user_id: userId,
                last_read_at: new Date().toISOString()
            }
        ], { onConflict: 'user_id' });

    if (error) {
        const errorMessage = createErrorString('update community read', 'user_community_reads', error);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
};

export const getCommunityStats = async (client: SupabaseClient<Database>, userId: string): Promise<CommunityStats> => {
    const [analysesCount, commentsCount, likesCount, userRead] = await Promise.all([
        client.from('community_analyses').select('id', { count: 'exact' }),
        client.from('community_comments').select('id', { count: 'exact' }),
        client.from('community_likes').select('id', { count: 'exact' }),
        client.from('user_community_reads').select('last_read_at').eq('user_id', userId).single()
    ]);

    let unreadCount = 0;
    if (userRead.data?.last_read_at) {
        const { count } = await client
            .from('community_analyses')
            .select('id', { count: 'exact' })
            .gt('created_at', userRead.data.last_read_at);
        unreadCount = count || 0;
    }

    return {
        total_analyses: analysesCount.count || 0,
        total_comments: commentsCount.count || 0,
        total_likes: likesCount.count || 0,
        unread_count: unreadCount
    };
};

export const checkIfAnalysisShared = async (client: SupabaseClient<Database>, userId: string, analysisId: string): Promise<boolean> => {
  const { data, error } = await client
    .from('community_analyses')
    .select('id')
    .eq('user_id', userId)
    .eq('analysis_id', analysisId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error checking if analysis shared:', error);
    throw new Error('Failed to check if analysis already shared');
  }

  return !!data; // Returns true if analysis is already shared
};

export const shareAnalysisToCommunity = async (client: SupabaseClient<any>, userId: string, analysis: TradeAnalysis, title?: string, description?: string) => {
  console.log('Sharing analysis to community:', {
    userId,
    analysisId: analysis.id,
    title,
    description,
    analysis
  });

  // Check if analysis is already shared by this user
  const alreadyShared = await checkIfAnalysisShared(client, userId, analysis.id);
  
  if (alreadyShared) {
    console.log('Analysis already shared by user, updating existing share');
    
    // Update existing share
    const { data, error } = await client
      .from('community_analyses')
      .update({
        title: title || `Shared Analysis - ${analysis.tradeSetup?.tradeType || ''} ${analysis.timestamp}`,
        description: description || '',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('analysis_id', analysis.id)
      .select()
      .single();

    if (error) {
      const errorMessage = createErrorString('update existing community analysis', 'community_analyses', error);
      console.error('Error updating existing share:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('Successfully updated existing share:', data);
    return data;
  }

  // Upsert ke tabel trades agar data analisa selalu lengkap di database
  const tradeSetup = analysis.tradeSetup || (analysis as any).trade_setup;
  const tradeSetupWithRRR = tradeSetup ? { ...tradeSetup, rrr: tradeSetup.rrr ?? 0 } : undefined;
  const tradeForDb = {
    id: analysis.id,
    user_id: userId,
    created_at: analysis.timestamp,
    image: analysis.image,
    mode: analysis.mode,
    market_trend: analysis.marketTrend,
    key_pattern: analysis.keyPattern,
    indicator_analysis: analysis.indicatorAnalysis,
    trade_bias: analysis.tradeBias,
    trade_setup: tradeSetupWithRRR,
    rationale: analysis.rationale,
    confidence_score: analysis.confidenceScore,
    status: analysis.status,
    outcome_amount: analysis.outcomeAmount || null
  };
  await client
    .from('trades')
    .upsert([tradeForDb], { onConflict: 'id' });

  // Create new share
  const { data, error } = await client
    .from('community_analyses')
    .insert({
      user_id: userId,
      analysis_id: analysis.id,
      title: title || `Shared Analysis - ${analysis.tradeSetup?.tradeType || ''} ${analysis.timestamp}`,
      description: description || ''
    })
    .select()
    .single();

  if (error) {
    const errorMessage = createErrorString('share analysis to community', 'community_analyses', error);
    console.error('Error sharing to community:', errorMessage);
    throw new Error(errorMessage);
  }

  console.log('Successfully shared to community:', data);
  return data;
};