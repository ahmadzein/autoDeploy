# Release Process for AutoDeploy

## Quick Release Steps

Every time you make changes to autoDeploy and want to update the Homebrew version:

### 1. Development Phase (can do many times)
```bash
cd /Users/ahmadzein/github/autoDeploy
# Make your changes
git add .
git commit -m "Your changes"
git push
```

### 2. Release Phase (only when ready for users)

#### Step 1: Update version numbers
```bash
# Edit package.json - change version (e.g., 1.0.0 → 1.1.0)
# Edit gui/package.json - change version to match
```

#### Step 2: Commit and create release
```bash
git add .
git commit -m "Release v1.1.0"
git push

# Create and push tag
git tag v1.1.0
git push origin v1.1.0
```

#### Step 3: Create GitHub Release
1. Go to https://github.com/ahmadzein/autoDeploy/releases
2. Click "Create a new release"
3. Choose your tag (v1.1.0)
4. Title: "v1.1.0"
5. Click "Publish release"

#### Step 4: Update Homebrew Formula
```bash
# Download the release tarball
cd /tmp
curl -L https://github.com/ahmadzein/autoDeploy/archive/refs/tags/v1.1.0.tar.gz -o autodeploy-v1.1.0.tar.gz

# Get the SHA256
shasum -a 256 autodeploy-v1.1.0.tar.gz
# Copy the hash output

# Update homebrew formula
cd /Users/ahmadzein/github/homebrew-autodeploy
```

Edit `Formula/autodeploy.rb`:
- Change `url` line to new version
- Change `sha256` to the new hash
- Update `version` if you added it

```bash
git add .
git commit -m "Update autodeploy to v1.1.0"
git push
```

## Automated Script

Save this as `release.sh` in your autoDeploy folder:

```bash
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
```

And `update-homebrew.sh`:

```bash
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
```

Make them executable:
```bash
chmod +x release.sh update-homebrew.sh
```

## Summary

- **Daily development**: Just commit and push to autoDeploy
- **Release to Homebrew**: Only when you want users to get the update
- **Version numbers**: Always increment (1.0.0 → 1.0.1 → 1.1.0)
- **Testing**: Always test locally before releasing