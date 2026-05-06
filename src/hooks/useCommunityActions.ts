import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useCommunityActions() {
  const { user } = useAuth();

  const createPost = async (content: string, mediaUrl?: string, mediaType?: "image" | "video") => {
    if (!user) return null;
    const trimmed = content.trim();
    if (!trimmed) { toast.error("Post não pode ser vazio"); return null; }
    if (trimmed.length > 500) { toast.error("Máximo de 500 caracteres"); return null; }

    // Extract hashtags and mentions
    const hashtags = [...trimmed.matchAll(/#(\w+)/g)].map((m) => m[1]);
    const mentions = [...trimmed.matchAll(/@(\w+)/g)].map((m) => m[1]);

    const { data, error } = await supabase.from("community_posts").insert({
      author_id: user.id,
      content: trimmed,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      hashtags,
      mentions,
    }).select().single();

    if (error) { toast.error("Erro ao publicar"); return null; }
    toast.success("Publicado!");
    return data;
  };

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!user) return;
    if (liked) {
      await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("community_likes").insert({ post_id: postId, user_id: user.id });
      // Notify post author
      const { data: post } = await supabase.from("community_posts").select("author_id").eq("id", postId).single();
      if (post && post.author_id !== user.id) {
        await supabase.from("community_notifications").insert({
          user_id: post.author_id,
          actor_id: user.id,
          type: "like",
          post_id: postId,
        });
      }
    }
  };

  const toggleRepost = async (postId: string, reposted: boolean) => {
    if (!user) return;
    if (reposted) {
      await supabase.from("community_reposts").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("community_reposts").insert({ post_id: postId, user_id: user.id });
      const { data: post } = await supabase.from("community_posts").select("author_id").eq("id", postId).single();
      if (post && post.author_id !== user.id) {
        await supabase.from("community_notifications").insert({
          user_id: post.author_id,
          actor_id: user.id,
          type: "repost",
          post_id: postId,
        });
      }
    }
  };

  const toggleSave = async (postId: string, saved: boolean) => {
    if (!user) return;
    if (saved) {
      await supabase.from("community_saves").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("community_saves").insert({ post_id: postId, user_id: user.id });
    }
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return null;
    const trimmed = content.trim();
    if (!trimmed) return null;

    const { data, error } = await supabase.from("community_comments").insert({
      post_id: postId,
      author_id: user.id,
      content: trimmed,
    }).select().single();

    if (error) { toast.error("Erro ao comentar"); return null; }

    // Notify post author
    const { data: post } = await supabase.from("community_posts").select("author_id").eq("id", postId).single();
    if (post && post.author_id !== user.id) {
      await supabase.from("community_notifications").insert({
        user_id: post.author_id,
        actor_id: user.id,
        type: "comment",
        post_id: postId,
      });
    }

    return data;
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) toast.error("Erro ao deletar");
    else toast.success("Post removido");
    return !error;
  };

  const uploadMedia = async (file: File): Promise<{ url: string; type: "image" | "video" } | null> => {
    if (!user) return null;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error("Formato não suportado"); return null; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 10MB)"); return null; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("community-media").upload(path, file);
    if (error) { toast.error("Erro no upload"); return null; }

    const { data: urlData } = supabase.storage.from("community-media").getPublicUrl(path);
    return { url: urlData.publicUrl, type: isImage ? "image" : "video" };
  };

  return { createPost, toggleLike, toggleRepost, toggleSave, addComment, deletePost, uploadMedia };
}
