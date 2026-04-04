#!/bin/bash

# Remove generated files and directories
echo "Cleaning up project..."
rm -rf node_modules
rm -rf ios/build
rm -rf ios/Pods
rm -rf "${TMPDIR}/metro-cache"
rm -rf "${HOME}/Library/Developer/Xcode/DerivedData/*"

# Reinstall dependencies
echo "Reinstalling dependencies..."
pnpm install

echo "Clean and reinstall complete!"
