import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, Palette, RotateCcw, Moon } from "lucide-react";
import { useTheme, AVAILABLE_FONTS } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

// Preset themes
const PRESET_THEMES = {
  emerald: {
    get name() { return i18n.t("ux.bo.emeraldDefault"); },
    primaryColor: "160 84% 39%",
    secondaryColor: "160 60% 45%",
    accentColor: "38 92% 50%",
    backgroundColor: "0 0% 100%",
    foregroundColor: "160 50% 10%",
    mutedColor: "160 20% 96%",
  },
  ocean: {
    get name() { return i18n.t("ux.bo.ocean"); },
    primaryColor: "221 83% 53%",
    secondaryColor: "217 91% 60%",
    accentColor: "199 89% 48%",
    backgroundColor: "0 0% 100%",
    foregroundColor: "222 47% 11%",
    mutedColor: "210 40% 96%",
  },
  sunset: {
    get name() { return i18n.t("ux.bo.sunset"); },
    primaryColor: "25 95% 53%",
    secondaryColor: "15 90% 55%",
    accentColor: "45 93% 47%",
    backgroundColor: "0 0% 100%",
    foregroundColor: "20 14% 4%",
    mutedColor: "30 20% 96%",
  },
  forest: {
    get name() { return i18n.t("ux.bo.forest"); },
    primaryColor: "142 76% 36%",
    secondaryColor: "142 69% 58%",
    accentColor: "84 81% 44%",
    backgroundColor: "0 0% 100%",
    foregroundColor: "142 50% 10%",
    mutedColor: "138 20% 96%",
  },
  royal: {
    name: "Royal",
    primaryColor: "262 83% 58%",
    secondaryColor: "270 67% 47%",
    accentColor: "326 100% 74%",
    backgroundColor: "0 0% 100%",
    foregroundColor: "260 50% 10%",
    mutedColor: "260 20% 96%",
  },
  rose: {
    name: "Rose",
    primaryColor: "350 89% 60%",
    secondaryColor: "340 82% 52%",
    accentColor: "330 81% 60%",
    backgroundColor: "0 0% 100%",
    foregroundColor: "350 50% 10%",
    mutedColor: "350 20% 96%",
  },
};

// HSL to hex conversion for color picker
const hslToHex = (hsl: string): string => {
  const parts = hsl.split(" ").map((v) => parseFloat(v));
  if (parts.length !== 3) return "#000000";
  
  const [h, s, l] = [parts[0], parts[1] / 100, parts[2] / 100];
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Hex to HSL conversion
const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export function ThemeConfig() {
  const { t } = useTranslation();
  const { theme, updateTheme } = useTheme();
  const { toast } = useToast();
  const [localTheme, setLocalTheme] = useState(theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleColorChange = (key: string, hex: string) => {
    const hsl = hexToHsl(hex);
    setLocalTheme((prev) => ({ ...prev, [key]: hsl }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTheme(localTheme);
      toast({
        title: t("ux.bo.success"),
        description: t("ux.bo.themeSavedApplied"),
      });
    } catch (error) {
      toast({
        title: t("ux.bo.error"),
        description: t("ux.bo.unableSaveTheme"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (presetKey: keyof typeof PRESET_THEMES) => {
    const preset = PRESET_THEMES[presetKey];
    setLocalTheme((prev) => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor,
      foregroundColor: preset.foregroundColor,
      mutedColor: preset.mutedColor,
    }));
  };

  const radiusValue = parseFloat(localTheme.borderRadius) || 0.5;

  return (
    <div className="space-y-6">
      {/* Preset Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("ux.bo.presetThemes")}
          </CardTitle>
          <CardDescription>{t("ux.bo.chooseBaseThemeThenCustomize")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(PRESET_THEMES).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key as keyof typeof PRESET_THEMES)}
                className="p-3 rounded-lg border-2 hover:border-primary transition-colors text-center"
              >
                <div
                  className="w-full h-8 rounded-md mb-2"
                  style={{ backgroundColor: hslToHex(preset.primaryColor) }}
                />
                <span className="text-xs font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ux.bo.colors")}</CardTitle>
          <CardDescription>{t("ux.bo.customizeSiteColors")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("ux.bo.primaryColor")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.primaryColor)}
                  onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.primaryColor}
                  onChange={(e) => setLocalTheme((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1"
                  placeholder="H S% L%"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.secondaryColor")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.secondaryColor)}
                  onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.secondaryColor}
                  onChange={(e) => setLocalTheme((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.accentColor")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.accentColor)}
                  onChange={(e) => handleColorChange("accentColor", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.accentColor}
                  onChange={(e) => setLocalTheme((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.background")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.backgroundColor)}
                  onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.backgroundColor}
                  onChange={(e) => setLocalTheme((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.mainText")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.foregroundColor)}
                  onChange={(e) => handleColorChange("foregroundColor", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.foregroundColor}
                  onChange={(e) => setLocalTheme((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.mutedColor")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.mutedColor)}
                  onChange={(e) => handleColorChange("mutedColor", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.mutedColor}
                  onChange={(e) => setLocalTheme((prev) => ({ ...prev, mutedColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            {t("ux.bo.darkModeColors")}
          </CardTitle>
          <CardDescription>{t("ux.bo.customizeColorsDarkMode")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>{t("ux.bo.backgroundDark")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.darkMode?.backgroundColor || "160 50% 5%")}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    setLocalTheme((prev) => ({
                      ...prev,
                      darkMode: { ...prev.darkMode, backgroundColor: hsl }
                    }));
                  }}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.darkMode?.backgroundColor || ""}
                  onChange={(e) => setLocalTheme((prev) => ({
                    ...prev,
                    darkMode: { ...prev.darkMode, backgroundColor: e.target.value }
                  }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.textDark")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.darkMode?.foregroundColor || "160 20% 98%")}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    setLocalTheme((prev) => ({
                      ...prev,
                      darkMode: { ...prev.darkMode, foregroundColor: hsl }
                    }));
                  }}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.darkMode?.foregroundColor || ""}
                  onChange={(e) => setLocalTheme((prev) => ({
                    ...prev,
                    darkMode: { ...prev.darkMode, foregroundColor: e.target.value }
                  }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.mutedDark")}</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={hslToHex(localTheme.darkMode?.mutedColor || "160 30% 15%")}
                  onChange={(e) => {
                    const hsl = hexToHsl(e.target.value);
                    setLocalTheme((prev) => ({
                      ...prev,
                      darkMode: { ...prev.darkMode, mutedColor: hsl }
                    }));
                  }}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={localTheme.darkMode?.mutedColor || ""}
                  onChange={(e) => setLocalTheme((prev) => ({
                    ...prev,
                    darkMode: { ...prev.darkMode, mutedColor: e.target.value }
                  }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ux.bo.typography")}</CardTitle>
          <CardDescription>{t("ux.bo.chooseFonts")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("ux.bo.headingFont")}</Label>
              <Select
                value={localTheme.fontHeading}
                onValueChange={(value) => setLocalTheme((prev) => ({ ...prev, fontHeading: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: localTheme.fontHeading }}>
                {t("ux.bo.previewSampleHeading")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("ux.bo.bodyFont")}</Label>
              <Select
                value={localTheme.fontBody}
                onValueChange={(value) => setLocalTheme((prev) => ({ ...prev, fontBody: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: localTheme.fontBody }}>
                {t("ux.bo.previewSampleParagraphText")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Border Radius */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ux.bo.cornerRounding")}</CardTitle>
          <CardDescription>{t("ux.bo.adjustCornerRoundingElements")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Slider
                value={[radiusValue]}
                onValueChange={([value]) =>
                  setLocalTheme((prev) => ({ ...prev, borderRadius: `${value}rem` }))
                }
                min={0}
                max={2}
                step={0.125}
                className="flex-1"
              />
              <span className="w-16 text-sm text-muted-foreground">{localTheme.borderRadius}</span>
            </div>
            <div className="flex gap-4">
              <div
                className="w-24 h-16 bg-primary"
                style={{ borderRadius: localTheme.borderRadius }}
              />
              <div
                className="w-24 h-16 border-2 border-primary"
                style={{ borderRadius: localTheme.borderRadius }}
              />
              <Button style={{ borderRadius: localTheme.borderRadius }}>{t("ux.bo.button")}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ux.bo.preview")}</CardTitle>
          <CardDescription>{t("ux.bo.previewChangesRealTime")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: hslToHex(localTheme.backgroundColor),
              color: hslToHex(localTheme.foregroundColor),
              borderRadius: localTheme.borderRadius,
            }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{
                fontFamily: localTheme.fontHeading,
                color: hslToHex(localTheme.primaryColor),
              }}
            >
              {t("ux.bo.pageTitle")}
            </h2>
            <p
              className="mb-4"
              style={{ fontFamily: localTheme.fontBody }}
            >
              {t("ux.bo.sampleTextPreviewLookCustom")}
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 text-white"
                style={{
                  backgroundColor: hslToHex(localTheme.primaryColor),
                  borderRadius: localTheme.borderRadius,
                }}
              >
                {t("ux.bo.primaryButton")}
              </button>
              <button
                className="px-4 py-2"
                style={{
                  backgroundColor: hslToHex(localTheme.secondaryColor),
                  color: "#fff",
                  borderRadius: localTheme.borderRadius,
                }}
              >
                {t("ux.bo.secondary")}
              </button>
              <button
                className="px-4 py-2"
                style={{
                  backgroundColor: hslToHex(localTheme.accentColor),
                  color: "#000",
                  borderRadius: localTheme.borderRadius,
                }}
              >
                Accent
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t("ux.bo.saveTheme")}
        </Button>
        <Button
          variant="outline"
          onClick={() => setLocalTheme(theme)}
          size="lg"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("ux.bo.cancel")}
        </Button>
      </div>
    </div>
  );
}
