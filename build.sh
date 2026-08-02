#!/usr/bin/env bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "==============================================="
echo "  Packaging Magic Clipper for Google Drive (TB)"
echo "==============================================="

# 1. Garde-fou de compilation Anti-Leak / Debug (Règle Global #12)
echo "🔍 Verification des constantes DEBUG..."
if grep -rn "const DEBUG = true" src/ background/ shared/ 2>/dev/null; then
  echo -e "${RED}❌ ÉCHEC DU BUILD : Une constante DEBUG = true est restée active dans le code !${NC}"
  exit 1
fi

# 2. Nettoyage du dossier de sortie dist/
echo "🧹 Nettoyage de dist/..."
mkdir -p dist
rm -f dist/*.xpi

# 3. Packaging .xpi natif
VERSION=$(grep '"version"' manifest.json | cut -d '"' -f 4)
XPI_NAME="mc4gd-tb-${VERSION}.xpi"

echo "📦 Compilation du package .xpi : ${XPI_NAME}..."
npx -y web-ext build --artifacts-dir dist --filename "${XPI_NAME}" --overwrite-dest

echo -e "${GREEN}✅ Build réussi ! Package disponible dans : dist/${XPI_NAME}${NC}"
