#!/usr/bin/env bash
set -euo pipefail

sudo pacman -Syu --needed \
  base-devel \
  cmake \
  pkgconf \
  git \
  curl \
  ffmpeg \
  openblas \
  lapacke \
  libmysofa

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
