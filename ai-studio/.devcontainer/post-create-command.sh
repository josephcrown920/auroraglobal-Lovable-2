#!/bin/bash
set -e

npm install -g pnpm
pnpm install
cp -n .env.example .env || true
mkdir -p output/{images,videos,json,logs,errors}
code --install-extension esbenp.prettier-vscode || true
code --install-extension dbaeumer.vscode-eslint || true
code --install-extension bradlc.vscode-tailwindcss || true
code --install-extension rangav.vscode-thunder-client || true
code --install-extension ms-vscode.vscode-typescript-next || true
pnpm format
echo "✅ AI Studio ready! Run: pnpm dev"
