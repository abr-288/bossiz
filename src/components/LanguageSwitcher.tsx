import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Globe, Search, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useSiteConfigContext } from "@/contexts/SiteConfigContext";

const LANGUAGES = [
  { code: "fr", label: "Français", nativeRegion: "France, Afrique francophone", flag: "🇫🇷" },
  { code: "en", label: "English", nativeRegion: "United Kingdom, International", flag: "🇬🇧" },
  { code: "zh", label: "中文", nativeRegion: "中国", flag: "🇨🇳" },
];

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const { config } = useSiteConfigContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Ne proposer que les langues activées dans la config admin
  // (site_config.locale.availableLanguages) ; si rien n'est configuré, on
  // propose toutes les langues supportées par le site.
  const enabledLanguages = useMemo(() => {
    const available = config.locale?.availableLanguages;
    if (!available || available.length === 0) return LANGUAGES;
    const filtered = LANGUAGES.filter((lang) => available.includes(lang.code));
    return filtered.length > 0 ? filtered : LANGUAGES;
  }, [config.locale?.availableLanguages]);

  const currentLanguage =
    enabledLanguages.find((lang) => lang.code === i18n.language) || enabledLanguages[0];

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enabledLanguages;
    return enabledLanguages.filter(
      (lang) =>
        lang.label.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.nativeRegion.toLowerCase().includes(q)
    );
  }, [query, enabledLanguages]);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("language", code);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs">{currentLanguage.flag} {currentLanguage.code.toUpperCase()}</span>
      </Button>

      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-secondary" />
            {t("nav.chooseLanguage", "Choisissez votre langue")}
          </DialogTitle>
          <DialogDescription>
            {t("nav.chooseLanguageDescription", "Sélectionnez la langue d'affichage du site")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchLanguage", "Rechercher une langue...")}
              className="pl-9 rounded-full"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredLanguages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("nav.noLanguageFound", "Aucune langue trouvée")}
            </p>
          ) : (
            <div className="grid gap-1">
              {filteredLanguages.map((lang) => {
                const isActive = lang.code === currentLanguage.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={cn(
                      "flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors",
                      isActive
                        ? "bg-secondary/10 border border-secondary/30"
                        : "hover:bg-muted border border-transparent"
                    )}
                  >
                    <span className="text-2xl leading-none">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium", isActive ? "text-secondary" : "text-foreground")}>
                        {lang.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{lang.nativeRegion}</p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-secondary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSwitcher;
