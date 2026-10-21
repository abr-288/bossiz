import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/20 to-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-primary">{t("notFound.title")}</h1>
        <p className="text-2xl font-semibold text-foreground">{t("notFound.subtitle")}</p>
        <p className="text-muted-foreground">{t("notFound.description")}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t("notFound.backHome")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
