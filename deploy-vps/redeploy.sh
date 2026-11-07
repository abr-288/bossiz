#!/usr/bin/env bash
# Redeploie le build de production sur le VPS (app.bossiz.com).
# Usage: bash deploy-vps/redeploy.sh
set -euo pipefail

VPS_HOST="ubuntu@169.58.93.234"
VPS_APP_DIR="/srv/projects/traversee-connect"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

echo "==> Build de production (npm run build)"
npm run build
[ -s dist/index.html ] || { echo "ERREUR : dist/index.html absent, build incomplet" >&2; exit 1; }

# Un seul flux « tar | ssh » de ~30 Mo coupait sur la connexion lente
# (« Connection reset by peer », 2026-10-27). On envoie donc une archive
# découpée en morceaux de 2 Mo, chacun renvoyé jusqu'à 5 fois, puis on vérifie
# l'empreinte SHA-256 sur le VPS avant de toucher au site en ligne.
echo "==> Préparation de l'archive"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
# tar (Git Bash) prend « C:... » pour un hôte distant : chemins au format /c/...
if command -v cygpath >/dev/null 2>&1; then WORK="$(cygpath -u "$WORK")"; fi
tar -czf "$WORK/dist.tgz" -C dist .
LOCAL_SHA="$(sha256sum "$WORK/dist.tgz" | cut -d' ' -f1)"
(cd "$WORK" && split -b 2M -d -a 3 dist.tgz part.)
PARTS=("$WORK"/part.*)
echo "    $(du -h "$WORK/dist.tgz" | cut -f1) en ${#PARTS[@]} morceau(x)"

echo "==> Envoi vers le VPS"
REMOTE_UP="${VPS_APP_DIR}/upload.tmp"
ssh "$VPS_HOST" "rm -rf ${REMOTE_UP} ${VPS_APP_DIR}/dist.new && mkdir -p ${REMOTE_UP} ${VPS_APP_DIR}/dist.new"
for part in "${PARTS[@]}"; do
  name="$(basename "$part")"
  for attempt in 1 2 3 4 5; do
    if scp -q -o ConnectTimeout=20 -o ServerAliveInterval=10 "$part" "$VPS_HOST:${REMOTE_UP}/$name"; then
      break
    fi
    if [ "$attempt" = 5 ]; then
      echo "ERREUR : envoi de $name impossible après 5 essais. Le site en ligne n'a pas été modifié." >&2
      exit 1
    fi
    echo "    $name : nouvel essai ($((attempt + 1))/5)…"
    sleep 3
  done
done

echo "==> Vérification de l'archive et extraction sur le VPS"
ssh "$VPS_HOST" "set -e
cd ${REMOTE_UP}
cat part.* > dist.tgz
echo '${LOCAL_SHA}  dist.tgz' | sha256sum -c --quiet
tar -xzf dist.tgz -C ${VPS_APP_DIR}/dist.new
test -s ${VPS_APP_DIR}/dist.new/index.html
grep -q 'id=\"root\"' ${VPS_APP_DIR}/dist.new/index.html
rm -rf ${REMOTE_UP}"

# IMPORTANT: le dossier dist/ est monté (bind mount) dans le conteneur nginx.
# On ne doit JAMAIS remplacer le dossier lui-même (mv/rm+mkdir) sous peine de
# rendre le point de montage orphelin (le conteneur continuerait de voir un
# dossier vide -> 500 "rewrite or internal redirection cycle"). On ne
# synchronise donc que le CONTENU, via rsync --delete, en conservant l'inode.
echo "==> Synchronisation du contenu (sans casser le bind mount)"
ssh "$VPS_HOST" "rsync -a --delete ${VPS_APP_DIR}/dist.new/ ${VPS_APP_DIR}/dist/ && rm -rf ${VPS_APP_DIR}/dist.new"

echo "==> Le conteneur nginx sert le contenu via bind mount : aucun redémarrage requis"
echo "==> Vérification"
sleep 1
STATUS="$(curl -s -o /dev/null -w "%{http_code}" "https://app.bossiz.com/?deploy=$(date +%s)" --max-time 15 || true)"
echo "HTTP $STATUS"
if [ "$STATUS" != "200" ]; then
  echo "ATTENTION : le site ne répond pas 200 après le déploiement." >&2
  exit 1
fi

echo "==> Déploiement terminé : https://app.bossiz.com"
