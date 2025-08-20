#!/bin/bash

# Simple cleanup script for Lyra browser extension
# This script removes all build artifacts and temporary files

echo "Cleaning up Lyra extension build artifacts..."

# Remove build directory
if [ -d "build" ]; then
    echo "Removing build directory..."
    rm -rf build
fi

# Remove package files
rm -f lyra-firefox-*.xpi
rm -f lyra-chrome-*.zip

# Remove temporary files
rm -f *.tmp *.log

# Remove OS-specific files
rm -f .DS_Store Thumbs.db

# Remove editor backup files
rm -f *~ *.bak *.swp *.swo

echo "Cleanup complete! Run './build.sh' to create a fresh build."
