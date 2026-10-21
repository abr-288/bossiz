import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errorMessage";

export interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = async (): Promise<EmailTemplate[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform variables from Json to string[]
      const templates = (data || []).map((template) => ({
        ...template,
        variables: Array.isArray(template.variables) ? template.variables.map((v) => String(v)) : [],
      }));

      return templates as EmailTemplate[];
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (template: Omit<EmailTemplate, "id" | "created_at" | "updated_at">) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("email_templates").insert([template]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Template créé avec succès",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (id: string, template: Partial<EmailTemplate>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("email_templates").update(template).eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Template mis à jour avec succès",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Template supprimé avec succès",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
