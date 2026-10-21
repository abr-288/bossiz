import { useToast } from "@/hooks/use-toast";

export const useExport = () => {
  const { toast } = useToast();

  // Lignes à exporter : n'importe quels objets, une colonne par clé.
  const exportToCSV = (data: object[], filename: string) => {
    try {
      if (!data || data.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucune donnée à exporter",
          variant: "destructive",
        });
        return;
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = (row as Record<string, unknown>)[header];
              // Escape commas and quotes in values
              const stringValue = value !== null && value !== undefined ? String(value) : "";
              return `"${stringValue.replace(/"/g, '""')}"`;
            })
            .join(","),
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export réussi",
        description: `Fichier ${filename}.csv téléchargé`,
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async (data: object[], filename: string) => {
    toast({
      title: "Export PDF",
      description: "Fonctionnalité à venir - utilisez CSV pour l'instant",
    });
  };

  return { exportToCSV, exportToPDF };
};
