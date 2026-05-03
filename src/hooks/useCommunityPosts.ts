import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  hashtags: string[];
  mentions: string[];
  created_at: string;
  author_name: string;
  author_username: string | null;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  liked_by_me: boolean;
  reposted_by_me: boolean;
  saved_by_me: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_username: string | null;
  author_avatar: string | null;
}

const PAGE_SIZE = 20;

export function useCommunityPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const fetchPosts = useCallback(async (page = 0, append = false) => {
    if (!user) return;
    setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: rawPosts, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !rawPosts) {
      setLoading(false);
      return;
    }

    if (rawPosts.length < PAGE_SIZE) setHasMore(false);

    // Get author profiles
    const authorIds = [...new Set(rawPosts.map((p: any) => p.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, username, avatar_url")
      .in("user_id", authorIds);

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    // Get interaction counts
    const postIds = rawPosts.map((p: any) => p.id);

    const [likesRes, commentsRes, repostsRes, myLikes, myReposts, mySaves] =
      await Promise.all([
        supabase.from("community_likes").select("post_id").in("post_id", postIds),
        supabase.from("community_comments").select("post_id").in("post_id", postIds),
        supabase.from("community_reposts").select("post_id").in("post_id", postIds),
        supabase.from("community_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        supabase.from("community_reposts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
        supabase.from("community_saves").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      ]);

    const count = (arr: any[] | null, id: string) =>
      (arr || []).filter((r: any) => r.post_id === id).length;
    const has = (arr: any[] | null, id: string) =>
      (arr || []).some((r: any) => r.post_id === id);

    const enriched: CommunityPost[] = rawPosts.map((p: any) => {
      const profile = profileMap.get(p.author_id);
      return {
        ...p,
        hashtags: p.hashtags || [],
        mentions: p.mentions || [],
        author_name: profile?.name || "Usuário",
        author_username: profile?.username || null,
        author_avatar: profile?.avatar_url || null,
        likes_count: count(likesRes.data, p.id),
        comments_count: count(commentsRes.data, p.id),
        reposts_count: count(repostsRes.data, p.id),
        liked_by_me: has(myLikes.data, p.id),
        reposted_by_me: has(myReposts.data, p.id),
        saved_by_me: has(mySaves.data, p.id),
      };
    });

    setPosts((prev) => (append ? [...prev, ...enriched] : enriched));
    setLoading(false);
  }, [user]);

  const loadMore = useCallback(() => {
    pageRef.current += 1;
    fetchPosts(pageRef.current, true);
  }, [fetchPosts]);

  const refresh = useCallback(() => {
    pageRef.current = 0;
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts]);

  useEffect(() => {
    if (user) fetchPosts(0);
  }, [user, fetchPosts]);

  // Realtime new posts
  useEffect(() => {
    const channel = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, () => {
        refresh();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { posts, loading, hasMore, loadMore, refresh, setPosts };
}

export function usePostComments(postId: string | null) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);

    const { data } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    const authorIds = [...new Set(data.map((c: any) => c.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, username, avatar_url")
      .in("user_id", authorIds);

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    setComments(
      data.map((c: any) => {
        const profile = profileMap.get(c.author_id);
        return {
          ...c,
          author_name: profile?.name || "Usuário",
          author_username: profile?.username || null,
          author_avatar: profile?.avatar_url || null,
        };
      })
    );
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, loading, refresh: fetchComments };
}
