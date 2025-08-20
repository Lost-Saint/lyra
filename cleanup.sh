#!/bin/bash

# Cleanup script for Lyra browser extension
# This script removes all build artifacts and temporary files

set -e  # Exit on any error

PROJECT_NAME="lyra"
BUILD_DIR="build"

# Default options
VERBOSE=false
DRY_RUN=false
FORCE=false

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Clean up Lyra extension build artifacts and temporary files"
    echo ""
    echo "OPTIONS:"
    echo "  -v, --verbose    Show detailed output"
    echo "  -n, --dry-run    Show what would be removed without actually removing"
    echo "  -f, --force      Remove files without confirmation prompts"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Standard cleanup"
    echo "  $0 -v           # Verbose cleanup"
    echo "  $0 -n           # Show what would be cleaned"
    echo "  $0 -f           # Force cleanup without prompts"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -n|--dry-run)
            DRY_RUN=true
            VERBOSE=true  # Dry run implies verbose
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

echo "===== Cleaning Lyra Extension Build Artifacts ====="
if [ "$DRY_RUN" = true ]; then
    echo "[DRY RUN MODE - Nothing will actually be removed]"
fi

# Function to safely remove directory if it exists
safe_remove_dir() {
    if [ -d "$1" ]; then
        if [ "$VERBOSE" = true ]; then
            echo "Found directory: $1"
        fi
        if [ "$DRY_RUN" = true ]; then
            echo "[DRY RUN] Would remove directory: $1"
        else
            echo "Removing directory: $1"
            rm -rf "$1"
        fi
    else
        if [ "$VERBOSE" = true ]; then
            echo "Directory not found: $1 (already clean)"
        fi
    fi
}

# Function to safely remove file if it exists
safe_remove_file() {
    if [ -f "$1" ]; then
        if [ "$VERBOSE" = true ]; then
            echo "Found file: $1"
        fi
        if [ "$DRY_RUN" = true ]; then
            echo "[DRY RUN] Would remove file: $1"
        else
            echo "Removing file: $1"
            rm -f "$1"
        fi
    else
        if [ "$VERBOSE" = true ]; then
            echo "File not found: $1 (already clean)"
        fi
    fi
}

# Function to remove files by pattern
safe_remove_pattern() {
    local pattern="$1"
    local files_found=false

    for file in $pattern; do
        if [ -f "$file" ]; then
            files_found=true
            if [ "$VERBOSE" = true ]; then
                echo "Found file: $file"
            fi
            if [ "$DRY_RUN" = true ]; then
                echo "[DRY RUN] Would remove file: $file"
            else
                echo "Removing file: $file"
                rm -f "$file"
            fi
        fi
    done

    if [ "$files_found" = false ] && [ "$VERBOSE" = true ]; then
        echo "No files found matching pattern: $pattern"
    fi
}

# Remove the entire build directory
safe_remove_dir "$BUILD_DIR"

# Remove any leftover package files in the root directory
safe_remove_pattern "$PROJECT_NAME-firefox-*.xpi"
safe_remove_pattern "$PROJECT_NAME-chrome-*.zip"

# Remove any temporary files that might be created during build
safe_remove_pattern "*.tmp"
safe_remove_pattern "*.log"

# Remove any OS-specific temporary files
safe_remove_file ".DS_Store"
safe_remove_file "Thumbs.db"

# Remove any editor backup files
safe_remove_pattern "*~"
safe_remove_pattern "*.bak"
safe_remove_pattern "*.swp"
safe_remove_pattern "*.swo"

# Clean up any node modules if they exist (in case of future JS tooling)
safe_remove_dir "node_modules"
safe_remove_file "package-lock.json"

echo "===== Cleanup Complete ====="
if [ "$DRY_RUN" = true ]; then
    echo "Dry run finished. Use './cleanup.sh' to actually remove the files."
else
    echo "All build artifacts have been removed."
    echo "You can now run './build.sh' to create a fresh build."
fi
