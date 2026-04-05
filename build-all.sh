#!/bin/bash
# Build completo — Moradda Imobiliária
# Compila site público + painel administrativo e integra tudo em /dist

set -e

echo "🏗️  Moradda Imobiliária — Build Completo"
echo "========================================"

# 1. Build do site público
echo ""
echo "📦 [1/3] Compilando site público..."
npm run build
echo "✅ Site público compilado"

# 2. Build do painel
echo ""
echo "📦 [2/3] Compilando painel administrativo..."
cd painel
npm run build
cd ..
echo "✅ Painel compilado"

# 3. Integrar painel no dist
echo ""
echo "🔗 [3/3] Integrando painel no dist..."
mkdir -p dist/painel
cp -r painel/dist/* dist/painel/
echo "✅ Painel integrado em dist/painel/"

# 4. Criar .htaccess para Apache (SPA routing)
cat > dist/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Se o arquivo ou diretório existe, servir diretamente
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Rotas do painel → painel/index.html
RewriteRule ^painel(/.*)?$ painel/index.html [L]

# Todas as outras rotas → index.html (SPA)
RewriteRule ^ index.html [L]
EOF

cat > dist/painel/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /painel/

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

RewriteRule ^ index.html [L]
EOF

echo ""
echo "✅ Build completo!"
echo ""
echo "📁 Saída: dist/"
echo "   - dist/          → Site público"
echo "   - dist/painel/   → Painel administrativo"
echo ""
echo "📊 Tamanho total:"
du -sh dist/
