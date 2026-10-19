import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { useTranslation } from "react-i18next";

interface ExportButtonsProps {
  data: any[];
  filename: string;
}

export function ExportButtons({ data, filename }: ExportButtonsProps) {
  const { t } = useTranslation();
  const { exportToCSV, exportToPDF } = useExport();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToCSV(data, filename)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {t("ux.bo.exportCsv2")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToPDF(data, filename)}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        {t("ux.bo.exportPdf")}
      </Button>
    </div>
  );
}
