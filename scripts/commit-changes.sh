#!/bin/bash

# Auto-commit script with detailed commit messages
# Usage: ./scripts/commit-changes.sh [commit message]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo "📋 Current branch: $BRANCH"

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Show what will be committed
echo ""
echo "📦 Changes to commit:"
git status --short

# If commit message provided, use it
if [ -n "$1" ]; then
    COMMIT_MSG="$1"
else
    # Generate commit message based on changes
    echo ""
    echo "🔍 Analyzing changes..."

    # Detect change types
    BACKEND_CHANGES=$(git diff --name-only --cached 2>/dev/null | grep -E "^backend/" | wc -l || echo "0")
    FRONTEND_CHANGES=$(git diff --name-only --cached 2>/dev/null | grep -E "^frontend/" | wc -l || echo "0")
    ADMIN_CHANGES=$(git diff --name-only --cached 2>/dev/null | grep -E "^admin-panel/" | wc -l || echo "0")
    SCRIPT_CHANGES=$(git diff --name-only --cached 2>/dev/null | grep -E "^scripts/" | wc -l || echo "0")
    DOC_CHANGES=$(git diff --name-only --cached 2>/dev/null | grep -E "\.md$" | wc -l || echo "0")
    CONFIG_CHANGES=$(git diff --name-only --cached 2>/dev/null | grep -E "(docker-compose|Dockerfile|\.conf)" | wc -l || echo "0")

    # Determine commit type
    if [ "$BACKEND_CHANGES" -gt 0 ] || [ "$FRONTEND_CHANGES" -gt 0 ] || [ "$ADMIN_CHANGES" -gt 0 ]; then
        TYPE="fix"
        if git diff --name-only --cached 2>/dev/null | grep -qE "(feat|feature|add|new)"; then
            TYPE="feat"
        fi
    elif [ "$SCRIPT_CHANGES" -gt 0 ]; then
        TYPE="chore"
    elif [ "$DOC_CHANGES" -gt 0 ]; then
        TYPE="docs"
    elif [ "$CONFIG_CHANGES" -gt 0 ]; then
        TYPE="chore"
    else
        TYPE="chore"
    fi

    # Generate subject
    CHANGED_FILES=$(git diff --name-only --cached 2>/dev/null | head -3 | sed 's|.*/||' | tr '\n' ', ' | sed 's/,$//' || echo "files")
    SUBJECT="Update $CHANGED_FILES"

    COMMIT_MSG="$TYPE: $SUBJECT"
fi

# Stage all changes
echo ""
echo "📝 Staging changes..."
git add -A

# Show what will be committed
echo ""
echo "📋 Files to commit:"
git status --short

# Create detailed commit message
DETAILED_MSG="$COMMIT_MSG

$(git diff --cached --stat)

Changes:
$(git diff --cached --name-only | sed 's/^/- /')

$(git diff --cached --name-status | head -10)"

# Commit
echo ""
echo -e "${YELLOW}📝 Commit message:${NC}"
echo "$COMMIT_MSG"
echo ""
read -p "Commit these changes? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    git commit -m "$DETAILED_MSG"
    echo ""
    echo -e "${GREEN}✅ Changes committed!${NC}"
    echo ""
    echo "📋 Commit details:"
    git log -1 --stat
    echo ""
    echo "🚀 Next step: git push origin $BRANCH"
else
    echo "❌ Commit cancelled"
    exit 1
fi

