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

echo "==> Envoi du nouveau build vers le VPS"
ssh "$VPS_HOST" "rm -rf ${VPS_APP_DIR}/dist.new && mkdir -p ${VPS_APP_DIR}/dist.new"
tar -czf - dist | ssh "$VPS_HOST" "tar -xzf - -C ${VPS_APP_DIR}/dist.new --strip-components=1"

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
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://app.bossiz.com/ --max-time 15

echo "==> Déploiement terminé : https://app.bossiz.com"
