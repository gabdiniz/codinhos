#!/bin/bash
# Roda typecheck após Claude editar arquivos TypeScript.
# Passagem mais leve: só avisa sobre erros, não bloqueia.

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

# Só rodar em arquivos TypeScript
case "$FILE_PATH" in
  *.ts|*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Rodar typecheck no monorepo (sem emitir arquivos)
OUTPUT=$(pnpm typecheck 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "⚠️  TypeScript errors detectados:"
  echo "$OUTPUT"
fi

# Sempre sair com 0 — typecheck é aviso, não bloqueio
exit 0
