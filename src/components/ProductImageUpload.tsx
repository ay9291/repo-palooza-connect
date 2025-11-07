import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Upload, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  existingImages?: string[];
}

const ProductImageUpload = ({ onImagesChange, existingImages = [] }: ProductImageUploadProps) => {
  const [imageUrls, setImageUrls] = useState<string[]>(existingImages);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    
    const newUrls = [...imageUrls, urlInput.trim()];
    setImageUrls(newUrls);
    onImagesChange(newUrls);
    setUrlInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const newUrls = [...imageUrls, ...uploadedUrls];
      setImageUrls(newUrls);
      onImagesChange(newUrls);

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    onImagesChange(newUrls);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Product Images *</Label>
        <p className="text-sm text-muted-foreground">At least one image is required</p>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="image_url">Add Image via URL</Label>
        <div className="flex gap-2">
          <Input
            id="image_url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlAdd())}
          />
          <Button type="button" onClick={handleUrlAdd} variant="outline">
            <LinkIcon className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="image_files">Upload from Device</Label>
        <div className="flex items-center gap-2">
          <Input
            id="image_files"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
        </div>
      </div>

      {/* Image Preview */}
      {imageUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Images ({imageUrls.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-1 left-1 bg-background/80 text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;
