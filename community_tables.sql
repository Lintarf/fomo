-- Community Tables for FOMO AI Trading Analyst
-- Run this entire block in Supabase SQL Editor

-- 1. Community Analyses Table
CREATE TABLE IF NOT EXISTS public.community_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_id UUID REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, analysis_id)
);

-- 2. Community Comments Table
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_id UUID REFERENCES public.community_analyses(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Community Likes Table
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_id UUID REFERENCES public.community_analyses(id) ON DELETE CASCADE NOT NULL,
    like_type TEXT CHECK (like_type IN ('like', 'dislike')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, analysis_id)
);

-- 4. User Community Reads Table
CREATE TABLE IF NOT EXISTS public.user_community_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.community_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_community_reads ENABLE ROW LEVEL SECURITY;

-- Community Analyses RLS Policies
-- SELECT: Anyone can view shared analyses
CREATE POLICY "Anyone can view community analyses" ON public.community_analyses
    FOR SELECT USING (true);

-- INSERT: Authenticated users can share their own analyses
CREATE POLICY "Users can share their own analyses" ON public.community_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owners can update their shared analyses
CREATE POLICY "Users can update their own shared analyses" ON public.community_analyses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Only owners can delete their shared analyses
CREATE POLICY "Users can delete their own shared analyses" ON public.community_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Community Comments RLS Policies
-- SELECT: Anyone can view comments
CREATE POLICY "Anyone can view community comments" ON public.community_comments
    FOR SELECT USING (true);

-- INSERT: Authenticated users can comment
CREATE POLICY "Authenticated users can comment" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only comment owners can update their comments
CREATE POLICY "Users can update their own comments" ON public.community_comments
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Only comment owners can delete their comments
CREATE POLICY "Users can delete their own comments" ON public.community_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Community Likes RLS Policies
-- SELECT: Anyone can view likes/dislikes
CREATE POLICY "Anyone can view community likes" ON public.community_likes
    FOR SELECT USING (true);

-- INSERT: Authenticated users can like/dislike
CREATE POLICY "Authenticated users can like/dislike" ON public.community_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can change their like/dislike
CREATE POLICY "Users can update their own likes" ON public.community_likes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can remove their like/dislike
CREATE POLICY "Users can delete their own likes" ON public.community_likes
    FOR DELETE USING (auth.uid() = user_id);

-- User Community Reads RLS Policies
-- SELECT: Users can view their own read status
CREATE POLICY "Users can view their own read status" ON public.user_community_reads
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create their own read status
CREATE POLICY "Users can create their own read status" ON public.user_community_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own read status
CREATE POLICY "Users can update their own read status" ON public.user_community_reads
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own read status
CREATE POLICY "Users can delete their own read status" ON public.user_community_reads
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_analyses_user_id ON public.community_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_community_analyses_created_at ON public.community_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_analyses_is_featured ON public.community_analyses(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_comments_analysis_id ON public.community_comments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created_at ON public.community_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_likes_analysis_id ON public.community_likes(analysis_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user_analysis ON public.community_likes(user_id, analysis_id);

-- Grant permissions to authenticated users
GRANT ALL ON public.community_analyses TO authenticated;
GRANT ALL ON public.community_comments TO authenticated;
GRANT ALL ON public.community_likes TO authenticated;
GRANT ALL ON public.user_community_reads TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to update likes/dislikes count
CREATE OR REPLACE FUNCTION update_analysis_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.like_type = 'like' THEN
            UPDATE public.community_analyses 
            SET likes_count = likes_count + 1 
            WHERE id = NEW.analysis_id;
        ELSIF NEW.like_type = 'dislike' THEN
            UPDATE public.community_analyses 
            SET dislikes_count = dislikes_count + 1 
            WHERE id = NEW.analysis_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Remove old like/dislike
        IF OLD.like_type = 'like' THEN
            UPDATE public.community_analyses 
            SET likes_count = likes_count - 1 
            WHERE id = OLD.analysis_id;
        ELSIF OLD.like_type = 'dislike' THEN
            UPDATE public.community_analyses 
            SET dislikes_count = dislikes_count - 1 
            WHERE id = OLD.analysis_id;
        END IF;
        -- Add new like/dislike
        IF NEW.like_type = 'like' THEN
            UPDATE public.community_analyses 
            SET likes_count = likes_count + 1 
            WHERE id = NEW.analysis_id;
        ELSIF NEW.like_type = 'dislike' THEN
            UPDATE public.community_analyses 
            SET dislikes_count = dislikes_count + 1 
            WHERE id = NEW.analysis_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.like_type = 'like' THEN
            UPDATE public.community_analyses 
            SET likes_count = likes_count - 1 
            WHERE id = OLD.analysis_id;
        ELSIF OLD.like_type = 'dislike' THEN
            UPDATE public.community_analyses 
            SET dislikes_count = dislikes_count - 1 
            WHERE id = OLD.analysis_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update comments count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_analyses 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.analysis_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_analyses 
        SET comments_count = comments_count - 1 
        WHERE id = OLD.analysis_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_analysis_counts ON public.community_likes;
CREATE TRIGGER trigger_update_analysis_counts
    AFTER INSERT OR UPDATE OR DELETE ON public.community_likes
    FOR EACH ROW EXECUTE FUNCTION update_analysis_counts();

DROP TRIGGER IF EXISTS trigger_update_comments_count ON public.community_comments;
CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- Success message
SELECT 'Community tables created successfully!' as message; 