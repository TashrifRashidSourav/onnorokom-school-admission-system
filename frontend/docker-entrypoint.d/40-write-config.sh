#!/bin/sh
# Runs automatically before nginx starts (official nginx image, /docker-entrypoint.d).
# Writes the runtime config so the backend URL comes from the API_URL
# environment variable instead of being fixed at build time.
set -eu

API_URL="${API_URL:-http://localhost:8080}"
# Drop characters that could break out of the JS string literal.
SAFE_API_URL=$(printf '%s' "$API_URL" | tr -d "'\"\\\\<>")

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  apiUrl: '${SAFE_API_URL}',
}
EOF

echo "40-write-config.sh: apiUrl=${SAFE_API_URL}"
