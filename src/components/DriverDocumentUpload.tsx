import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, FileImage, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriverDocumentUploadProps {
  label: string;
  docType: "license_front" | "license_back" | "applicant_photo";
  path: string;
  onChange: (path: string) => void;
}

// Uploads a driver's license photo or applicant photo to the private
// driver-documents bucket via upload-driver-document (open to any
// authenticated customer, unlike ImageUpload -> upload-site-asset which is
// admin/sub_agency only and writes to a PUBLIC bucket - identity documents
// must never go through that path). Only `path` (the storage path) is
// meant to be persisted; `previewUrl` is a short-lived signed URL used
// solely to render the thumbnail during this session.
export function DriverDocumentUpload({ label, docType, path, onChange }: DriverDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "La taille maximale est de 5 Mo", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Format invalide", description: "Veuillez sélectionner une image", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Vous devez être connecté pour envoyer un document");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-driver-document`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur d'upload");
      }

      onChange(result.path);
      setPreviewUrl(result.previewUrl || null);

      toast({ title: "Document envoyé", description: "Votre photo a bien été enregistrée" });
    } catch (error: any) {
      console.error("Driver document upload error:", error);
      toast({ title: "Erreur d'upload", description: error.message || "Impossible d'envoyer le document", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label} *</label>
      <div className="flex gap-3 items-start">
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
          {previewUrl ? (
            <>
              <img src={previewUrl} alt={label} className="w-full h-full object-cover" onError={() => setPreviewUrl(null)} />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <FileImage className="w-7 h-7 text-muted-foreground/50" />
          )}
        </div>

        <div className="flex-1 space-y-1.5">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : path ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "Envoi..." : path ? "Remplacer" : "Choisir une photo"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG/PNG, 5 Mo max. Visible uniquement par vous et B-Reserve.</p>
        </div>
      </div>
    </div>
  );
}
