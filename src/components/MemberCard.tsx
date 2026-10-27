import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import QRCode from "react-qr-code";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { foilGradient, memberCardTheme, memberNumber, memberVerifyUrl } from "@/lib/memberCardThemes";

interface MemberCardProps {
  planId: string;
  planName: string;
  holderName: string;
  memberCode: string;
  validUntil: string | null;
  expired?: boolean;
  size?: "md" | "lg";
  // Recto : identité de la carte ; verso : QR code de vérification.
  defaultSide?: "front" | "back";
  className?: string;
}

// ---------------------------------------------------------------------------
// Motifs de sécurité (calculés une fois) : guilloché façon billet de banque
// et rosaces en hypotrochoïde, tracés dans un repère 1000 × 630.
// ---------------------------------------------------------------------------
const wave = (y0: number, amplitude: number, wavelength: number, phase: number): string => {
  let d = "";
  for (let x = -20; x <= 1020; x += 12) {
    const y = y0 + amplitude * Math.sin((x / wavelength) * Math.PI * 2 + phase);
    d += `${x === -20 ? "M" : "L"}${x},${y.toFixed(1)}`;
  }
  return d;
};

const rosette = (
  cx: number,
  cy: number,
  R: number,
  r: number,
  dist: number,
  turns: number,
  rotation: number,
): string => {
  let d = "";
  const steps = 420;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const k = (R - r) / r;
    const x = (R - r) * Math.cos(t) + dist * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - dist * Math.sin(k * t);
    const xr = cx + x * Math.cos(rotation) - y * Math.sin(rotation);
    const yr = cy + x * Math.sin(rotation) + y * Math.cos(rotation);
    d += `${i === 0 ? "M" : "L"}${xr.toFixed(1)},${yr.toFixed(1)}`;
  }
  return d;
};

const GUILLOCHE_WAVES = [
  ...Array.from({ length: 30 }, (_, i) => wave(20 + i * 21, 16, 280, i * 0.32)),
  ...Array.from({ length: 30 }, (_, i) => wave(30 + i * 21, 11, 190, -i * 0.27 + 1.4)),
];
// Rosace dense centrée sur le médaillon de la formule (≈ 890, 345 dans le
// repère) : 24 hypotrochoïdes à 5 lobes décalées d'un quinzième de tour.
const MEDALLION = { x: 890, y: 345 };
const ROSETTES = Array.from({ length: 24 }, (_, i) =>
  rosette(MEDALLION.x, MEDALLION.y, 150, 30, 62, 1, (i / 24) * ((Math.PI * 2) / 5)),
);

// Date de validité au format carte (MM/AA)
const monthYear = (iso: string | null): string => {
  if (!iso) return "--/--";
  const date = new Date(iso);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Carte de membre électronique (format ISO carte bancaire 85,6 × 54 mm).
// Toutes les cotes sont exprimées en « u » = 1 % de la largeur : la carte
// garde ses proportions exactes quelle que soit sa taille d'affichage.
export function MemberCard({
  planId,
  planName,
  holderName,
  memberCode,
  validUntil,
  expired = false,
  size = "md",
  defaultSide = "front",
  className,
}: MemberCardProps) {
  const { t } = useTranslation();
  const theme = memberCardTheme(planId);
  const Icon = theme.icon;
  const foil = foilGradient(theme);
  const reduceMotion = useMemo(prefersReducedMotion, []);
  // Identifiants SVG propres à cette carte (plusieurs cartes par page)
  const uid = useId().replace(/:/g, "");

  const frameRef = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState(size === "lg" ? 5.2 : 4);
  const [flipped, setFlipped] = useState(defaultSide === "back");
  const [pointer, setPointer] = useState({ x: 50, y: 50, active: false });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setUnit(entry.contentRect.width / 100));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const u = (n: number) => `${(n * unit).toFixed(2)}px`;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  const tiltX = pointer.active ? ((pointer.y - 50) / 50) * -6 : 0;
  const tiltY = pointer.active ? ((pointer.x - 50) / 50) * 8 : 0;

  const foilText: CSSProperties = {
    backgroundImage: foil,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.45))",
  };

  const face: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: u(4.6),
    overflow: "hidden",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    background: `linear-gradient(140deg, ${theme.material[0]} 0%, ${theme.material[1]} 48%, ${theme.material[2]} 100%)`,
    boxShadow: `0 ${u(2.4)} ${u(6)} rgba(0,0,0,0.38), 0 ${u(0.5)} ${u(1.2)} rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.09)`,
    color: theme.ink,
    filter: expired ? "grayscale(1) brightness(0.85)" : undefined,
  };

  // Couches communes aux deux faces : guilloché, grain, lumière, reflet
  const surface = (withRosette: boolean) => (
    <>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 630" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={`foil-${uid}`} x1="0" y1="0" x2="1" y2="1">
            {theme.foil.map((color, i) => (
              <stop key={i} offset={i / (theme.foil.length - 1)} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <g fill="none" stroke={`url(#foil-${uid})`} strokeWidth="0.7" opacity="0.13">
          {GUILLOCHE_WAVES.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {withRosette && (
          <g fill="none" stroke={`url(#foil-${uid})`} strokeWidth="0.55" opacity="0.2">
            {ROSETTES.map((d, i) => (
              <path key={i} d={d} />
            ))}
            <circle cx={MEDALLION.x} cy={MEDALLION.y} r="196" strokeWidth="0.9" />
            <circle cx={MEDALLION.x} cy={MEDALLION.y} r="204" strokeWidth="0.5" />
          </g>
        )}
      </svg>
      <svg className="absolute inset-0 h-full w-full opacity-[0.09] mix-blend-overlay" aria-hidden>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${uid})`} />
      </svg>
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 12% 0%, rgba(255,255,255,0.16), transparent 55%)" }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light transition-[background-position] duration-300"
        style={{
          backgroundImage:
            "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0.15) 55%, transparent 70%)",
          backgroundSize: "250% 100%",
          backgroundPosition: `${100 - pointer.x}% 0`,
          opacity: pointer.active ? 1 : 0.45,
        }}
      />
    </>
  );

  const label: CSSProperties = { fontSize: u(1.75), letterSpacing: "0.3em", color: theme.inkMuted };

  return (
    <div className={cn("w-full", size === "lg" ? "max-w-[540px]" : "max-w-[420px]", className)}>
      <div ref={frameRef} style={{ perspective: u(220) }}>
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={`${t("ux.memberCard.title")} ${planName} - ${holderName}. ${t("ux.memberCard.flipHint")}`}
          onClick={() => setFlipped((side) => !side)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setFlipped((side) => !side);
            }
          }}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setPointer({ x: 50, y: 50, active: false })}
          className="relative w-full cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          style={{
            aspectRatio: "1.586",
            borderRadius: u(4.6),
            transformStyle: "preserve-3d",
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY + (flipped ? 180 : 0)}deg)`,
            transition: reduceMotion
              ? "none"
              : pointer.active
                ? "transform 120ms ease-out"
                : "transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {/* ------------------------------ RECTO ------------------------------ */}
          <div style={face}>
            {surface(true)}

            {/* Marque */}
            <div
              className="absolute flex items-baseline font-display font-bold"
              style={{ left: u(6.5), top: u(5.6), fontSize: u(5.4), letterSpacing: "-0.01em" }}
            >
              <span>Conciergerie Bossiz</span>
              <span style={foilText}>+</span>
            </div>

            {/* Sans contact */}
            <svg
              className="absolute"
              style={{ right: u(6.5), top: u(5.8), width: u(5), height: u(5) }}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.ink}
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.8"
              aria-hidden
            >
              <path d="M8.5 8.5a5 5 0 0 1 0 7" />
              <path d="M12 6a8.5 8.5 0 0 1 0 12" />
              <path d="M15.5 3.5a12 12 0 0 1 0 17" />
            </svg>

            {/* Puce */}
            <svg
              className="absolute"
              style={{ left: u(6.5), top: u(20), width: u(11.5), height: u(8.8) }}
              viewBox="0 0 46 35"
              aria-hidden
            >
              <defs>
                <linearGradient id={`chip-${uid}`} x1="0" y1="0" x2="1" y2="1">
                  {theme.foil.map((color, i) => (
                    <stop key={i} offset={i / (theme.foil.length - 1)} stopColor={color} />
                  ))}
                </linearGradient>
              </defs>
              <rect
                x="0.5"
                y="0.5"
                width="45"
                height="34"
                rx="6"
                fill={`url(#chip-${uid})`}
                stroke="rgba(0,0,0,0.35)"
              />
              <g fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="1">
                <path d="M0.5 12h13M0.5 23h13M32.5 12h13M32.5 23h13M13.5 0.5v34M32.5 0.5v34" />
                <rect x="13.5" y="8" width="19" height="19" rx="3" />
              </g>
            </svg>

            {/* Formule */}
            <div className="absolute" style={{ left: u(6.5), top: u(32) }}>
              <p className="font-semibold uppercase" style={label}>
                {t("ux.memberCard.title")}
              </p>
              <p
                className="font-display font-extrabold uppercase leading-none"
                style={{ ...foilText, fontSize: u(8.6), letterSpacing: "0.015em", marginTop: u(1) }}
              >
                {planName}
              </p>
            </div>

            {/* Emblème de la formule */}
            <div
              className="absolute flex items-center justify-center rounded-full"
              style={{
                right: u(6.5),
                top: u(30),
                width: u(9),
                height: u(9),
                backgroundImage: foil,
                boxShadow: `0 ${u(0.3)} ${u(1)} rgba(0,0,0,0.45), inset 0 0 0 ${u(0.25)} rgba(255,255,255,0.35)`,
              }}
            >
              <Icon style={{ width: u(4.6), height: u(4.6), color: theme.material[2] }} strokeWidth={2.2} />
            </div>

            {/* Titulaire et validité */}
            <div
              className="absolute flex items-end justify-between"
              style={{ left: u(6.5), right: u(6.5), bottom: u(5.6), gap: u(4) }}
            >
              <div className="min-w-0">
                <p
                  className="truncate font-semibold uppercase"
                  style={{ fontSize: u(3.4), letterSpacing: "0.14em", textShadow: "0 1px 0 rgba(0,0,0,0.5)" }}
                >
                  {holderName}
                </p>
                <p
                  className="font-mono"
                  style={{ fontSize: u(2.4), letterSpacing: "0.16em", color: theme.inkMuted, marginTop: u(0.8) }}
                >
                  {memberNumber(memberCode)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold uppercase" style={{ ...label, letterSpacing: "0.22em" }}>
                  {t("ux.memberCard.validity")}
                </p>
                <p
                  className="font-mono font-semibold"
                  style={{ fontSize: u(3.6), letterSpacing: "0.08em", textShadow: "0 1px 0 rgba(0,0,0,0.5)" }}
                >
                  {monthYear(validUntil)}
                </p>
              </div>
            </div>

            {expired && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-display font-black uppercase"
                  style={{
                    fontSize: u(6),
                    letterSpacing: "0.2em",
                    color: "rgba(255,255,255,0.92)",
                    border: `${u(0.8)} solid rgba(255,255,255,0.85)`,
                    borderRadius: u(1.6),
                    padding: `${u(0.6)} ${u(3)}`,
                    transform: "rotate(-12deg)",
                  }}
                >
                  {t("ux.memberCard.expired")}
                </span>
              </div>
            )}
          </div>

          {/* ------------------------------ VERSO ------------------------------ */}
          <div style={{ ...face, transform: "rotateY(180deg)" }}>
            {surface(false)}
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />

            {/* Bande magnétique */}
            <div
              className="absolute left-0 right-0"
              style={{
                top: u(7),
                height: u(11.5),
                background: "linear-gradient(180deg, #0c0c0d, #2a2a2d 45%, #0a0a0b)",
              }}
            />

            {/* Bande de signature */}
            <div className="absolute" style={{ left: u(6.5), top: u(24), width: u(54) }}>
              <div
                className="flex items-center"
                style={{
                  height: u(9.5),
                  borderRadius: u(1),
                  padding: `0 ${u(2.4)}`,
                  background: "repeating-linear-gradient(-45deg, #F4EFE4 0, #F4EFE4 6px, #E9E2D3 6px, #E9E2D3 7px)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
                }}
              >
                <span className="truncate font-display italic" style={{ fontSize: u(3.6), color: "#1C1F2A" }}>
                  {holderName}
                </span>
              </div>
              <p style={{ fontSize: u(1.85), lineHeight: 1.5, color: theme.inkMuted, marginTop: u(2.4) }}>
                {t("ux.memberCard.backNotice")}
              </p>
            </div>

            {/* QR code de vérification */}
            <div className="absolute flex flex-col items-center" style={{ right: u(6.5), top: u(22) }}>
              <div
                style={{
                  background: "#fff",
                  borderRadius: u(1.8),
                  padding: u(1.5),
                  boxShadow: `0 ${u(0.4)} ${u(1.4)} rgba(0,0,0,0.4)`,
                }}
              >
                <QRCode value={memberVerifyUrl(memberCode)} size={Math.round(unit * 21)} level="M" fgColor="#0B0F19" />
              </div>
              <p className="font-semibold uppercase" style={{ ...label, letterSpacing: "0.18em", marginTop: u(1.4) }}>
                {t("ux.memberCard.scanToVerify")}
              </p>
            </div>

            {/* Pied */}
            <div
              className="absolute flex items-end justify-between"
              style={{ left: u(6.5), right: u(6.5), bottom: u(5) }}
            >
              <p className="font-mono" style={{ fontSize: u(2.4), letterSpacing: "0.16em" }}>
                {memberNumber(memberCode)}
              </p>
              <p className="flex items-baseline font-display font-bold" style={{ fontSize: u(3.2) }}>
                <span>Conciergerie Bossiz</span>
                <span style={foilText}>+</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <RotateCcw className="h-3.5 w-3.5" />
        {t("ux.memberCard.flipHint")}
      </p>
    </div>
  );
}
