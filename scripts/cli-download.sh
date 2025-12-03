#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"
USER_NAME="${USER_NAME:-ops}"
USER_PASS="${USER_PASS:-853211}"
QUERY="${1:-}"
SORT="${SORT:-downloads}"

urlencode(){ python -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))' "$1"; }

TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USER_NAME\",\"password\":\"$USER_PASS\"}" \
  | python -c 'import sys,json;print(json.load(sys.stdin).get("access_token",""))')
test -n "$TOKEN"

MODELS_JSON=$(curl -s "$BASE_URL/models?query=$(urlencode "$QUERY")&sort=$SORT")
MODEL_ID=$(echo "$MODELS_JSON" | python -c 'import sys,json,os; d=json.load(sys.stdin); print((d[0] if d else {}).get("id",""))')
if [ -n "$QUERY" ]; then
  MODEL_ID=$(echo "$MODELS_JSON" | python -c 'import sys,json,os; d=json.load(sys.stdin); q=os.environ.get("Q","" ); cand=[x for x in d if x.get("slug")==q or x.get("name")==q]; print((cand[0] if cand else (d[0] if d else {})).get("id",""))' Q="$QUERY")
fi
test -n "$MODEL_ID"

FILES_JSON=$(curl -s "$BASE_URL/models/$MODEL_ID/files")
download_list(){ python - <<'PY'
import os,json
d=json.loads(os.environ.get('FILES_JSON','[]'))
for x in d:
    print(str(x.get('id',''))+'\t'+x.get('filename','file'))
PY
}

COUNT=0
while IFS=$'\t' read -r fid fname; do
  [ -n "$fid" ] || continue
  curl -L -H "Authorization: Bearer $TOKEN" "$BASE_URL/files/$fid/download" -o "$fname"
  COUNT=$((COUNT+1))
  echo "downloaded: $fname"
done < <(FILES_JSON="$FILES_JSON" download_list)

echo "ok: downloaded $COUNT file(s) from model $MODEL_ID"
