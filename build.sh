#!/bin/bash

# Build script for Lyra browser extension
# This script creates packages for different browsers

# Set up variables
PROJECT_NAME="lyra"
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)
BUILD_DIR="build"
FIREFOX_DIR="$BUILD_DIR/firefox"
CHROME_DIR="$BUILD_DIR/chrome"

# Create build directories
mkdir -p "$FIREFOX_DIR" "$CHROME_DIR"

# Function to check if icon files exist
check_icons() {
  mkdir -p "assets/icons" "assets/images"

  if [ ! -f "assets/icons/icon.svg" ]; then
    echo "Error: icon.svg is missing but referenced in manifest.json"
    echo "Creating a placeholder icon..."
    echo '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#5b5bff"/><path d="M24 10c-7.732 0-14 6.268-14 14s6.268 14 14 14 14-6.268 14-14-6.268-14-14-14zm-5 20.5v-13l12 6.5-12 6.5z" fill="white"/></svg>' > assets/icons/icon.svg
  fi

  if [ ! -f "assets/icons/icon-inv.svg" ]; then
    echo "Error: icon-inv.svg is missing but referenced in manifest.json"
    echo "Creating a placeholder inverted icon..."
    echo '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#3030a0"/><path d="M24 10c-7.732 0-14 6.268-14 14s6.268 14 14 14 14-6.268 14-14-6.268-14-14-14zm-5 20.5v-13l12 6.5-12 6.5z" fill="black"/></svg>' > assets/icons/icon-inv.svg
  fi

  if [ ! -f "assets/images/coffee.svg" ]; then
    echo "Creating coffee.svg icon..."
    echo '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#FFDD44" d="M7 14c0-1.86 1.28-3.41 3-3.86V9c-2.84.48-5 2.94-5 5.83V19h2v-5z"/><path fill="#FF813F" d="M18 9H8c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h8c3.31 0 6-2.69 6-6v-2c0-2.21-1.79-4-4-4zm2 6c0 2.21-1.79 4-4 4H8v-8h8c1.1 0 2 .9 2 2v2z"/><path fill="#5D4037" d="M12 6.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5z"/><path fill="#5D4037" d="M10 6.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5z"/><path fill="#5D4037" d="M14 6.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5z"/></svg>' > assets/images/coffee.svg
  fi
}

# Build Firefox extension
build_firefox() {
  echo "Building Firefox extension..."
  # Copy all necessary files to the Firefox build directory
  mkdir -p "$FIREFOX_DIR/assets/icons" "$FIREFOX_DIR/assets/images" "$FIREFOX_DIR/src"
  cp manifest.json LICENSE.md "$FIREFOX_DIR"
  cp src/popup.html src/popup.js src/popup.css "$FIREFOX_DIR/src"
  cp assets/icons/icon.svg assets/icons/icon-inv.svg "$FIREFOX_DIR/assets/icons"
  cp assets/images/github.svg assets/images/coffee.svg "$FIREFOX_DIR/assets/images"

  # Create XPI package
  cd "$FIREFOX_DIR" || exit
  zip -r "../$PROJECT_NAME-firefox-$VERSION.xpi" *
  cd "../.." || exit

  echo "Firefox extension built: $BUILD_DIR/$PROJECT_NAME-firefox-$VERSION.xpi"
}

# Build Chrome extension
build_chrome() {
  echo "Building Chrome extension..."

  # Use the Chrome manifest if it exists, otherwise convert the Firefox manifest
  if [ -f "manifest.chrome.json" ]; then
    cp manifest.chrome.json "$CHROME_DIR/manifest.json"
  else
    echo "Warning: manifest.chrome.json not found. Creating one from Firefox manifest..."
    cat manifest.json |
      sed 's/"manifest_version": 2/"manifest_version": 3/' |
      sed 's/"browser_specific_settings":{[^}]*},//' |
      sed 's/"browser_action"/"action"/' > "$CHROME_DIR/manifest.json"
  fi

  # Copy all necessary files to the Chrome build directory
  mkdir -p "$CHROME_DIR/assets/icons" "$CHROME_DIR/assets/images" "$CHROME_DIR/src"
  cp LICENSE.md "$CHROME_DIR"
  cp src/popup.html src/popup.js src/popup.css "$CHROME_DIR/src"
  cp assets/icons/icon.svg assets/icons/icon-inv.svg "$CHROME_DIR/assets/icons"
  cp assets/images/github.svg assets/images/coffee.svg "$CHROME_DIR/assets/images"

  # Create ZIP package
  cd "$CHROME_DIR" || exit
  zip -r "../$PROJECT_NAME-chrome-$VERSION.zip" *
  cd "../.." || exit

  echo "Chrome extension built: $BUILD_DIR/$PROJECT_NAME-chrome-$VERSION.zip"
}

# Main execution
echo "===== Building Lyra Extension v$VERSION ====="
check_icons
build_firefox
build_chrome
echo "===== Build Complete ====="
echo "Files are available in the '$BUILD_DIR' directory"
