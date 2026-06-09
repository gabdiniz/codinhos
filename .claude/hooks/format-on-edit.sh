#!/bin/bash
# Roda após Claude editar/criar um arquivo.
# Lê o JSON do tool use via stdin e extrai o file_path para rodar o Biome.

FILE_PATH=$(python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    path = data.get('tool_input', {}).get('file_path', '') or \
           data.get('tool_input', {}).get('new_file_path', '')
    print(path)
except:
    print('')
")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Só processar arquivos JS/TS/TSX/JSON — ignorar outros
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json)
    ;;
  *)
    exit 0
    ;;
esac

# Rodar Biome no arquivo específico (mais rápido que rodar no monorepo inteiro)
pnpm biome check --write "$FILE_PATH" 2>/dev/null

exit 0
