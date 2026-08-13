// Widget de recherche d'hôtels Stay22 (données réelles pour Abidjan).
// Remplace la recherche via useHotelSearch (RapidAPI), qui ne renvoyait que
// des données mock faute de clés API fiables.
const HotelsWidget = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <iframe
        id="stay22-widget"
        title="Recherche d'hôtels à Abidjan"
        width="100%"
        height="428"
        src="https://stay22.com/embed/6a7e4e46ef221c981e3e57a4"
        frameBorder="0"
        loading="lazy"
        style={{ border: "none", borderRadius: "12px" }}
      />
    </div>
  );
};

export default HotelsWidget;
