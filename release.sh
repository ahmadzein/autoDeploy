#!/bin/bash
# Usage: ./release.sh 1.1.0

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./release.sh VERSION"
    echo "Example: ./release.sh 1.1.0"
    exit 1
fi

echo "Releasing version $VERSION"

# Update package.json files
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" gui/package.json

# Commit and tag
git add .
git commit -m "Release v$VERSION"
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "✅ Tagged v$VERSION"
echo "📝 Now create release at: https://github.com/ahmadzein/autoDeploy/releases/new"
echo ""
echo "After creating release, run:"
echo "  ./update-homebrew.sh $VERSION"