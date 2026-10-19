// Rejoue les scénarios de test de l'assistante contre la fonction déployée
// et écrit les réponses dans un fichier Markdown.
//
// Usage : node scripts/assistant-scenarios.mjs <sortie.md> [titre]
// Lit VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env (clé
// publique du site : les appels sont faits comme un visiteur non connecté).
// Chaque scénario coûte environ un centime de dollar d'API.
import { readFileSync, writeFileSync } from "node:fs";

const [outPath, title = "Réponses de l'assistante"] = process.argv.slice(2);
if (!outPath) {
  console.error("Usage : node scripts/assistant-scenarios.mjs <sortie.md> [titre]");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).replace(/^["']|["']$/g, "")])
);
const url = `${env.VITE_SUPABASE_URL}/functions/v1/travel-chatbot`;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const scenarios = JSON.parse(readFileSync("docs/assistant/scenarios.json", "utf8"));
const welcome = "Bonjour, je suis Bozi, l'assistant Bossiz+ 👋 Comment puis-je vous aider ?";

let md = `# ${title}\n\n*Généré le ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC contre la fonction déployée, en visiteur non connecté.*\n`;
for (const s of scenarios) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "assistant", content: welcome },
        { role: "user", content: s.message },
      ],
      locale: s.categorie === "Anglais" ? "en" : "fr",
    }),
  });
  const data = await res.json().catch(() => ({}));
  const reply = data.reply ?? `[ERREUR HTTP ${res.status}] ${data.error ?? ""}`;
  const extra = data.handoff ? "\n\n*→ Propose de transmettre à un conseiller.*" : "";
  md += `\n## ${s.id}. ${s.categorie}\n\n**Client :** ${s.message}\n\n**Assistante :**\n\n${reply.split("\n").map((l) => `> ${l}`).join("\n")}${extra}\n`;
  console.log(`${s.id}/${scenarios.length} ${s.categorie} — ${reply.length} car.`);
}
writeFileSync(outPath, md);
console.log(`Écrit : ${outPath}`);
