#!/bin/bash

docker run \
  --user $(id -u):$(id -g) \
  --rm \
  -v $PWD:/app \
  ghcr.io/prebuild/linux-arm64:2 \
  bash -c 'npm -w /app/packages/server run pre-build-arm'
