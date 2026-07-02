#!/bin/bash
# Yatri AI Setup Verification Script

echo "🔍 Yatri AI Setup Verification"
echo "=============================="
echo ""

# Check Node.js
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js installed: $NODE_VERSION"
else
    echo "   ❌ Node.js not found. Please install Node.js"
    exit 1
fi

# Check npm
echo ""
echo "2️⃣  Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "   ✅ npm installed: $NPM_VERSION"
else
    echo "   ❌ npm not found. Please install npm"
    exit 1
fi

# Check Ollama
echo ""
echo "3️⃣  Checking Ollama..."
if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version)
    echo "   ✅ Ollama installed: $OLLAMA_VERSION"
else
    echo "   ⚠️  Ollama not found. Install with: curl -fsSL https://ollama.com/install.sh | sh"
fi

# Check if Ollama is running
echo ""
echo "4️⃣  Checking if Ollama service is running..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "   ✅ Ollama is running on http://localhost:11434"
    
    # Check for Gemma3 model
    echo ""
    echo "5️⃣  Checking for Gemma3 model..."
    if curl -s http://localhost:11434/api/tags | grep -q "gemma3"; then
        echo "   ✅ Gemma3 model is available"
    else
        echo "   ⚠️  Gemma3 model not found. Download with: ollama run gemma3"
    fi
else
    echo "   ❌ Ollama is not running. Start with: ollama serve"
fi

# Check if project files exist
echo ""
echo "6️⃣  Checking project structure..."
if [ -f "package.json" ]; then
    echo "   ✅ package.json found"
else
    echo "   ❌ package.json not found. Are you in the project directory?"
    exit 1
fi

if [ -f "src/components/YatriAI.tsx" ]; then
    echo "   ✅ YatriAI component found"
else
    echo "   ❌ YatriAI component not found"
    exit 1
fi

if [ -f "server.js" ]; then
    echo "   ✅ server.js found"
else
    echo "   ❌ server.js not found"
    exit 1
fi

# Check npm dependencies
echo ""
echo "7️⃣  Checking npm dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules exists"
else
    echo "   ⚠️  node_modules not found. Run: npm install"
fi

# Final summary
echo ""
echo "=============================="
echo "✅ Verification Complete!"
echo ""
echo "🚀 To start the services:"
echo ""
echo "Terminal 1 (Ollama):"
echo "  $ ollama serve"
echo ""
echo "Terminal 2 (Backend):"
echo "  $ node server.js"
echo ""
echo "Terminal 3 (Frontend):"
echo "  $ npm run dev"
echo ""
echo "Then open http://localhost:5173"
echo ""
