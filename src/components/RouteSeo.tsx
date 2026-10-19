import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolveSeo } from "@/config/seo";

// Met à jour titre, description, canonique, robots et balises de partage à
// chaque changement de route. Modifie les balises déjà présentes dans
// index.html (ou les crée) pour ne jamais produire de doublons.
const upsert = (selector: string, create: () => HTMLElement, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const setMeta = (key: "name" | "property", name: string, content: string) =>
  upsert(
    `meta[${key}="${name}"]`,
    () => {
      const m = document.createElement("meta");
      m.setAttribute(key, name);
      return m;
    },
    "content",
    content,
  );

const RouteSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = resolveSeo(pathname);

    document.title = seo.title;
    setMeta("name", "title", seo.title);
    setMeta("name", "description", seo.description);
    setMeta("name", "robots", seo.noindex ? "noindex, nofollow" : "index, follow");

    upsert(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      },
      "href",
      seo.canonicalUrl,
    );

    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:url", seo.canonicalUrl);
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);
    setMeta("name", "twitter:url", seo.canonicalUrl);
  }, [pathname]);

  return null;
};

export default RouteSeo;
