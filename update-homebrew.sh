#!/bin/bash
# Usage: ./update-homebrew.sh 1.1.0

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./update-homebrew.sh VERSION"
    exit 1
fi

# Download and get SHA256
cd /tmp
curl -L "https://github.com/ahmadzein/autoDeploy/archive/refs/tags/v$VERSION.tar.gz" -o "autodeploy-v$VERSION.tar.gz"
SHA256=$(shasum -a 256 "autodeploy-v$VERSION.tar.gz" | cut -d' ' -f1)

echo "SHA256: $SHA256"

# Update homebrew formula
cd /Users/ahmadzein/github/homebrew-autodeploy
sed -i '' "s|url \".*\"|url \"https://github.com/ahmadzein/autoDeploy/archive/refs/tags/v$VERSION.tar.gz\"|" Formula/autodeploy.rb
sed -i '' "s|sha256 \".*\"|sha256 \"$SHA256\"|" Formula/autodeploy.rb

git add .
git commit -m "Update autodeploy to v$VERSION"
git push

echo "✅ Homebrew formula updated!"
echo "Users can now: brew upgrade autodeploy"