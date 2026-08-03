#!/bin/bash

# Remove generated files and directories
echo "Cleaning up project..."
rm -rf ios/build
rm -rf ios/Pods
rm -rf "${TMPDIR}/metro-cache"
rm -rf "${HOME}/Library/Developer/Xcode/DerivedData/*"
echo "Cleaning complete!"
