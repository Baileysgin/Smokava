#!/bin/bash
# Script to find and rename logo file to the correct location

PUBLIC_DIR="/Users/negar/Desktop/Smokava/frontend/public"
SEARCH_DIR="/Users/negar/Desktop"

echo "Searching for logo files..."

# Find any image files with smokava/logo in name
find "$SEARCH_DIR" -maxdepth 3 -type f \( -iname "*smokava*" -o -iname "*logo*" \) \( -iname "*.svg" -o -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) 2>/dev/null | while read file; do
    if [ -f "$file" ] && [ ! -f "$PUBLIC_DIR/logo.svg" ] && [ ! -f "$PUBLIC_DIR/logo.png" ]; then
        echo "Found: $file"
        extension="${file##*.}"
        cp "$file" "$PUBLIC_DIR/logo.$extension"
        echo "Copied to: $PUBLIC_DIR/logo.$extension"
        break
    fi
done

echo "Done! Please check the public folder."
