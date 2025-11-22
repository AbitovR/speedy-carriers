#!/bin/bash

# Speedy Carriers - Push to GitHub
# This script will push your code to GitHub

echo "🚀 Pushing Speedy Carriers to GitHub..."
echo ""
echo "Repository: https://github.com/AbitovR/speedy-carriers"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Error: Git not initialized"
    echo "Run: git init"
    exit 1
fi

# Stage all files
echo "📦 Staging files..."
git add .

# Create commit
echo "💾 Creating commit..."
git commit -m "Deploy: Driver payment system to Vercel" || echo "Nothing new to commit"

# Change branch to main if needed
echo "🔄 Setting up main branch..."
git branch -M main

# Add remote if not exists
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/AbitovR/speedy-carriers.git
fi

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Check your repository at:"
echo "   https://github.com/AbitovR/speedy-carriers"
