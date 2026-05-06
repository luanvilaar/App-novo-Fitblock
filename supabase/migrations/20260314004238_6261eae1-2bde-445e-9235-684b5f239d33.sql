
-- Add username and bio to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Community Posts
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 500),
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video', NULL)),
  hashtags text[] DEFAULT '{}',
  mentions text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community Comments
CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community Likes
CREATE TABLE public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Community Reposts
CREATE TABLE public.community_reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Community Saves
CREATE TABLE public.community_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Community Notifications
CREATE TABLE public.community_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'repost', 'mention')),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

-- Posts: anyone authenticated can read, authors can insert/update/delete own
CREATE POLICY "Anyone reads posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors insert posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own posts" ON public.community_posts FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Authors update own posts" ON public.community_posts FOR UPDATE TO authenticated USING (author_id = auth.uid());

-- Comments: authenticated read, authors insert/delete own
CREATE POLICY "Anyone reads comments" ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors insert comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors delete own comments" ON public.community_comments FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Likes
CREATE POLICY "Anyone reads likes" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users toggle likes" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove likes" ON public.community_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Reposts
CREATE POLICY "Anyone reads reposts" ON public.community_reposts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users toggle reposts" ON public.community_reposts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove reposts" ON public.community_reposts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Saves
CREATE POLICY "Anyone reads saves" ON public.community_saves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users toggle saves" ON public.community_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove saves" ON public.community_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "Users read own notifications" ON public.community_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.community_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.community_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_community_posts_author ON public.community_posts(author_id);
CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_comments_post ON public.community_comments(post_id);
CREATE INDEX idx_community_likes_post ON public.community_likes(post_id);
CREATE INDEX idx_community_likes_user ON public.community_likes(user_id);
CREATE INDEX idx_community_reposts_post ON public.community_reposts(post_id);
CREATE INDEX idx_community_saves_user ON public.community_saves(user_id);
CREATE INDEX idx_community_notifications_user ON public.community_notifications(user_id, read);

-- Storage bucket for community media
INSERT INTO storage.buckets (id, name, public) VALUES ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated upload community media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-media');
CREATE POLICY "Public read community media" ON storage.objects FOR SELECT USING (bucket_id = 'community-media');
CREATE POLICY "Users delete own community media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'community-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- Function to get post counts efficiently
CREATE OR REPLACE FUNCTION public.get_post_counts(post_ids uuid[])
RETURNS TABLE (
  post_id uuid,
  likes_count bigint,
  comments_count bigint,
  reposts_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as post_id,
    (SELECT count(*) FROM community_likes cl WHERE cl.post_id = p.id) as likes_count,
    (SELECT count(*) FROM community_comments cc WHERE cc.post_id = p.id) as comments_count,
    (SELECT count(*) FROM community_reposts cr WHERE cr.post_id = p.id) as reposts_count
  FROM unnest(post_ids) AS p(id)
$$;
