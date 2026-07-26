# Architecture

## Provider Abstraction

`packages/core/src/providers` defines an `AIProvider` interface and a registry for:
Claude, OpenAI, Gemini, Fal, HuggingFace, Replicate, Runware, Kling, Seedance, Minimax, Veo, and Luma.

Switching providers uses one value: `NEXT_PUBLIC_PRIMARY_PROVIDER`.

## Output System

Generated files are organized under:

- `output/images`
- `output/videos`
- `output/json`
- `output/logs`
- `output/errors`

## Codespaces Automation

`.devcontainer/post-create-command.sh` installs pnpm, dependencies, `.env`, output folders, VS Code extensions, and formatting.
