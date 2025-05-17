#!/bin/bash

# Script to optimize images in the project
# This script requires imagemin-cli to be installed globally
# npm install -g imagemin-cli imagemin-mozjpeg imagemin-pngquant

echo "📷 Optimizing images for FinFlow app..."

# Create a temp directory for optimized images
mkdir -p temp_optimized

# Optimize PNG files
echo "Optimizing PNG files..."
find public src -type f -name "*.png" | xargs -P 4 -I{} sh -c '
  echo "Processing: $1"
  imagemin "$1" --plugin=pngquant > "temp_optimized/$(basename "$1")"
  mv "temp_optimized/$(basename "$1")" "$1"
' -- {}

# Optimize JPG/JPEG files
echo "Optimizing JPEG files..."
find public src -type f \( -name "*.jpg" -o -name "*.jpeg" \) | xargs -P 4 -I{} sh -c '
  echo "Processing: $1"
  imagemin "$1" --plugin=mozjpeg > "temp_optimized/$(basename "$1")"
  mv "temp_optimized/$(basename "$1")" "$1"
' -- {}

# Clean up
rm -rf temp_optimized

echo "✅ Image optimization complete!"
echo "You may need to rebuild your app to see the changes."
