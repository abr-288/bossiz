import { cn } from "@/lib/utils";

interface LogoProps {
  /** "dark" = mark colored for use on light backgrounds. "light" = mark colored for use on dark backgrounds. */
  variant?: "dark" | "light";
  className?: string;
  showWordmark?: boolean;
}

const NAVY = "#192342";
const ACCENT = "#00D28A";

const Logo = ({ variant = "dark", className, showWordmark = true }: LogoProps) => {
  const isLight = variant === "light";
  const badgeFill = isLight ? "#FFFFFF" : NAVY;
  const badgeMark = isLight ? NAVY : "#FFFFFF";
  const wordColor = isLight ? "#FFFFFF" : NAVY;

  return (
    <svg
      viewBox={showWordmark ? "0 0 172 40" : "0 0 40 40"}
      className={cn("h-9 w-auto", className)}
      role="img"
      aria-label="B-Reserve"
    >
      <rect x="0" y="0" width="40" height="40" rx="11" fill={badgeFill} />
      <text
        x="20"
        y="28.5"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={800}
        fontSize={21}
        fill={badgeMark}
      >
        B
      </text>
      <circle cx="32.5" cy="8" r="4" fill={ACCENT} />

      {showWordmark && (
        <text
          x="49"
          y="27"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={800}
          fontSize={20}
          letterSpacing="-0.02em"
          fill={wordColor}
        >
          <tspan>B</tspan>
          <tspan fill={ACCENT}>-</tspan>
          <tspan>Reserve</tspan>
        </text>
      )}
    </svg>
  );
};

export default Logo;
