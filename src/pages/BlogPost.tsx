import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  featured_image: string | null;
  category: string;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setPost(data as any);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: "Error",
        description: "Failed to load blog post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Blog post not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>

          <article className="space-y-6">
            {post.featured_image && (
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="text-sm">
                  {post.category}
                </Badge>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-foreground">
                {post.title}
              </h1>

              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div 
              className="prose prose-lg max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
