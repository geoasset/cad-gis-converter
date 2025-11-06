#!/usr/bin/env python3
"""
Installation script for the CAD to GIS Converter Backend
"""

import sys
import subprocess
import platform
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Command: {cmd}")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required, found {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_system_dependencies():
    """Install system dependencies based on OS"""
    system = platform.system().lower()
    
    if system == "linux":
        # Check if we're on Ubuntu/Debian
        try:
            subprocess.run(["which", "apt-get"], check=True, capture_output=True)
            print("🐧 Detected Ubuntu/Debian system")
            
            commands = [
                "sudo apt-get update",
                "sudo apt-get install -y gdal-bin libgdal-dev g++ gcc python3-dev"
            ]
            
            for cmd in commands:
                if not run_command(cmd, f"Installing system dependencies: {cmd}"):
                    return False
            return True
            
        except subprocess.CalledProcessError:
            print("⚠️  Could not detect package manager. Please install GDAL manually:")
            print("   Ubuntu/Debian: sudo apt-get install gdal-bin libgdal-dev g++ gcc")
            print("   CentOS/RHEL: sudo yum install gdal-devel gcc-c++")
            return False
    
    elif system == "darwin":  # macOS
        print("🍎 Detected macOS system")
        if not run_command("which brew", "Checking for Homebrew"):
            print("❌ Homebrew not found. Please install it first:")
            print("   /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
            return False
        
        return run_command("brew install gdal", "Installing GDAL via Homebrew")
    
    elif system == "windows":
        print("🪟 Detected Windows system")
        print("⚠️  For Windows, we recommend using the simplified requirements (no GDAL)")
        print("   Or install GDAL via conda-forge or OSGeo4W")
        return True
    
    else:
        print(f"⚠️  Unknown system: {system}")
        print("   Please install GDAL manually for your system")
        return True

def install_python_dependencies():
    """Install Python dependencies"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    requirements_simple = Path(__file__).parent / "requirements-simple.txt"
    
    # Try full requirements first
    print("🐍 Attempting to install full requirements (with GDAL)...")
    if run_command(f"pip install -r {requirements_file}", "Installing Python dependencies"):
        return True
    
    # Fall back to simplified requirements
    print("⚠️  Full installation failed. Trying simplified requirements...")
    print("   (This will skip GDAL-dependent features)")
    
    return run_command(f"pip install -r {requirements_simple}", "Installing simplified Python dependencies")

def test_installation():
    """Test that the installation works"""
    print("🧪 Testing installation...")
    
    test_script = Path(__file__).parent / "test_conversion.py"
    if not test_script.exists():
        print("⚠️  Test script not found, skipping tests")
        return True
    
    return run_command(f"python {test_script}", "Running installation tests")

def main():
    """Main installation process"""
    print("🚀 CAD to GIS Converter Backend Installation")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install system dependencies
    print("\n📦 Installing system dependencies...")
    if not install_system_dependencies():
        print("⚠️  System dependency installation had issues, but continuing...")
    
    # Install Python dependencies
    print("\n🐍 Installing Python dependencies...")
    if not install_python_dependencies():
        print("❌ Python dependency installation failed")
        sys.exit(1)
    
    # Test installation
    print("\n🧪 Testing installation...")
    if not test_installation():
        print("⚠️  Installation tests failed, but installation may still work")
    
    print("\n🎉 Installation completed!")
    print("\n📋 Next steps:")
    print("   1. Run the backend: python main.py")
    print("   2. Access API docs: http://localhost:8000/docs")
    print("   3. Test conversion: python test_conversion.py")

if __name__ == "__main__":
    main()