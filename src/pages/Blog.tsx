import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts' as any)
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts((data as any) || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              Furniture Blog & Resources
            </h1>
            <p className="text-xl text-muted-foreground">
              Expert tips, design inspiration, and furniture care guides
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                No blog posts available yet
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {post.featured_image && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="space-y-2">
                        <Badge variant="secondary">{post.category}</Badge>
                        <h2 className="text-xl font-bold line-clamp-2 text-foreground">
                          {post.title}
                        </h2>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Blog;
