#!/usr/bin/env python3
"""
Setup script for WebAI Chrome Extension with Gemini
"""

import os
import sys
import subprocess
import json

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print("✅ Python version is compatible")
    return True

def install_dependencies():
    """Install Python dependencies"""
    try:
        print("📦 Installing Python dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False

def setup_gemini_api():
    """Setup Gemini API key"""
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("\n🔑 Gemini API Key Setup")
        print("1. Go to https://makersuite.google.com/app/apikey")
        print("2. Create a new API key")
        print("3. Copy the API key")
        
        api_key = input("\nEnter your Gemini API key: ").strip()
        
        if api_key:
            # Set environment variable for current session
            os.environ["GOOGLE_API_KEY"] = api_key
            
            # Save to .env file for future use
            with open(".env", "w") as f:
                f.write(f"GOOGLE_API_KEY={api_key}\n")
            
            print("✅ API key saved to .env file")
            return True
        else:
            print("❌ No API key provided")
            return False
    else:
        print("✅ Gemini API key already configured")
        return True

def test_api_connection():
    """Test the API connection"""
    try:
        import google.generativeai as genai
        from langgraph import StateGraph, END
        
        print("🧪 Testing API connection...")
        
        # Test Gemini connection
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("❌ No API key found")
            return False
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        # Simple test
        response = model.generate_content("Hello, this is a test.")
        if response.text:
            print("✅ Gemini API connection successful")
            return True
        else:
            print("❌ Gemini API test failed")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def create_chrome_extension_config():
    """Create Chrome extension configuration"""
    try:
        print("🔧 Configuring Chrome extension...")
        
        # Read background.js
        with open("background.js", "r") as f:
            content = f.read()
        
        # Update API endpoint for local development
        content = content.replace(
            "this.apiEndpoint = 'https://your-langgraph-api.com/summarize';",
            "this.apiEndpoint = 'http://localhost:8000/summarize';"
        )
        
        # Remove API key requirement for local testing
        content = content.replace(
            "'Authorization': 'Bearer YOUR_API_KEY'",
            "'Authorization': 'Bearer test-key'"
        )
        
        # Write updated file
        with open("background.js", "w") as f:
            f.write(content)
        
        print("✅ Chrome extension configured for local development")
        return True
        
    except Exception as e:
        print(f"❌ Failed to configure Chrome extension: {e}")
        return False

def print_next_steps():
    """Print next steps for the user"""
    print("\n🎉 Setup Complete!")
    print("\n📋 Next Steps:")
    print("1. Start the LangGraph server:")
    print("   python langgraph_server.py")
    print("\n2. Load the Chrome extension:")
    print("   - Open Chrome and go to chrome://extensions/")
    print("   - Enable 'Developer mode'")
    print("   - Click 'Load unpacked' and select this directory")
    print("\n3. Test the extension:")
    print("   - Navigate to any web page")
    print("   - Click the WebAI extension icon")
    print("   - Try the different features")
    print("\n📚 For more information, see README.md")

def main():
    """Main setup function"""
    print("🚀 WebAI Chrome Extension Setup")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Setup Gemini API
    if not setup_gemini_api():
        sys.exit(1)
    
    # Test API connection
    if not test_api_connection():
        print("⚠️  API test failed, but you can still proceed")
    
    # Configure Chrome extension
    if not create_chrome_extension_config():
        sys.exit(1)
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    main() 