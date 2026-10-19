import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  accept?: string;
}

export function ImageUpload({ 
  value, 
  onChange, 
  folder = "general",
  label = "Image",
  accept = "image/*"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("ux.bo.fileTooLarge"),
        description: t("ux.bo.maximumSize5Mb"),
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: t("ux.bo.invalidFormat"),
        description: t("ux.bo.pleaseSelectImage"),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(t("ux.bo.notAuthenticated"));
      }

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      // Call edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error(t("ux.bo.storageConfigurationUnavailable"));

      const response = await fetch(
        `${supabaseUrl}/functions/v1/upload-site-asset`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("ux.bo.uploadError"));
      }

      setPreview(result.url);
      onChange(result.url);

      toast({
        title: t("ux.bo.imageUploaded"),
        description: t("ux.bo.imageWasUploadedSuccessfully"),
      });
    } catch (error: unknown) {
      console.error("Upload error");
      toast({
        title: t("ux.bo.uploadError"),
        description: error instanceof Error ? error.message : t("ux.bo.unableUploadImage"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <div className="flex gap-2 items-start">
        {/* Preview */}
        {preview ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setPreview(null)}
            />
            <button
              type="button"
              aria-label={t("ux.common.removeImage")}
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          {/* URL Input */}
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setPreview(e.target.value);
            }}
            placeholder={t("ux.bo.imageUrlUpload")}
            className="text-sm"
          />
          
          {/* Upload Button */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? "Upload..." : "Télécharger"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
