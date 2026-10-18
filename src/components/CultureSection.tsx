import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CultureEntryCard, CultureEntryDialog } from "@/components/culture/CultureEntryCard";
import { useCultureEntries, useCulturePage, type CultureEntry } from "@/lib/culture";

// Section « Culture » de l'accueil : 4 entrées publiées (à la une d'abord) et
// un lien vers la page /culture. Masquée tant que rien n'est publié.
const CultureSection = () => {
  const { data: settings } = useCulturePage();
  const { data: entries } = useCultureEntries();
  const [openEntry, setOpenEntry] = useState<CultureEntry | null>(null);

  const published = (entries ?? []).filter((e) => e.published);
  if (published.length === 0) return null;
  const picks = [...published.filter((e) => e.featured), ...published.filter((e) => !e.featured)].slice(0, 4);

  return (
    <section className="py-10 md:py-16 w-full">
      <div className="site-container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{settings?.title || "Culture"}</h2>
            {settings?.subtitle && <p className="text-sm text-muted-foreground mt-1">{settings.subtitle}</p>}
          </div>
          <Button asChild variant="outline" className="w-fit">
            <Link to="/culture">Découvrir la culture</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {picks.map((entry) => (
            <CultureEntryCard key={entry.id} entry={entry} onOpen={setOpenEntry} />
          ))}
        </div>
      </div>
      <CultureEntryDialog entry={openEntry} onClose={() => setOpenEntry(null)} />
    </section>
  );
};

export default CultureSection;
