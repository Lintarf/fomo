-- Users Table Setup
-- This table stores user profiles and preferences

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT NOT NULL,
    nama TEXT,
    initial_trade DECIMAL(20, 8) DEFAULT 0,
    describe TEXT,
    tier TEXT DEFAULT 'free'
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, nama)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nama', 'User')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Settings Table Setup
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    gemini_api_key TEXT
);

-- Enable Row Level Security for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings table (admin only for now)
CREATE POLICY "Allow all operations for authenticated users"
    ON public.settings
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Trades Table Setup (if not exists)
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    image TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('scalping', 'day_trading', 'swing_trading', 'position_trading')),
    market_trend TEXT NOT NULL,
    key_pattern TEXT NOT NULL,
    indicator_analysis TEXT NOT NULL,
    trade_bias TEXT NOT NULL,
    trade_setup JSONB NOT NULL,
    rationale TEXT NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'profit', 'stop-loss')),
    outcome_amount DECIMAL(20, 8)
);

-- Enable Row Level Security for trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create policies for trades table
CREATE POLICY "Users can view their own trades"
    ON public.trades
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
    ON public.trades
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
    ON public.trades
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
    ON public.trades
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for trades table
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status); 