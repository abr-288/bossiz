import { useEffect, useRef } from "react";

const TRAVELPAYOUTS_WIDGET_SRC =
  "https://tpscr.com/content?currency=xof&trs=536765&shmarker=736555&show_hotels=true&powered_by=true&locale=fr&searchUrl=www.aviasales.com%2Fsearch&primary_override=%23192443&color_button=%231F2933&color_icons=%231f2933&dark=%23262626&light=%23FFFFFF&secondary=%23FFFFFF&special=%231F2933&color_focused=%2300f59b&border_radius=9&no_labels=&plain=true&origin=ABJ&destination=DKR&promo_id=7879&campaign_id=100";

/**
 * FlightSearchForm - Widget de recherche de vols TravelPayouts (affiliation Aviasales)
 */
export const FlightSearchForm = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.async = true;
    script.charset = "utf-8";
    script.src = TRAVELPAYOUTS_WIDGET_SRC;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return <div ref={containerRef} className="w-full max-w-5xl mx-auto" />;
};
