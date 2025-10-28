# Setup Guide for ArtChain DLT

## Prerequisites Installation

### 1. Install Foundry (Ethereum Development Toolkit)

Foundry is required for compiling, testing, and deploying smart contracts.

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Reload your shell or run:
source ~/.bashrc  # or ~/.zshrc if using zsh

# Install the latest version
foundryup

# Verify installation
forge --version
anvil --version
cast --version
```

### 2. Install Node.js and npm

Required for the Cloud Fabric service.

```bash
# Check if already installed
node --version
npm --version

# If not installed, use nvm (Node Version Manager):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify
node --version  # Should be v18+ or v20+
npm --version
```

### 3. Install Additional Tools

```bash
# jq for JSON parsing (optional but recommended)
sudo apt-get install jq  # Ubuntu/Debian
# or
brew install jq  # macOS
```

## Project Setup

### 1. Clone and Navigate to Project

```bash
cd /home/newuser/DLT-ARTCHAIN
```

### 2. Install Dependencies

```bash
# Install Solidity dependencies (OpenZeppelin contracts)
forge install

# Install Node.js dependencies for Cloud Fabric
cd cloud-fabric
npm install
cd ..
```

### 3. Verify Setup

```bash
# Check that contracts can be compiled
forge build

# Check that tests can run
forge test

# Check Cloud Fabric can build
cd cloud-fabric
npm run build
cd ..
```

## Quick Test

Once everything is installed:

```bash
# Run the complete test suite
./test-local.sh
```

## Troubleshooting

### Forge command not found

```bash
# Add Foundry to PATH
echo 'export PATH="$HOME/.foundry/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Permission denied for test-local.sh

```bash
chmod +x test-local.sh
```

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8545
lsof -ti:8545 | xargs kill -9
```

### Node modules errors

```bash
cd cloud-fabric
rm -rf node_modules package-lock.json
npm install
```

### Forge build fails

```bash
# Clean and rebuild
forge clean
forge install
forge build
```

## What Gets Installed

### Foundry Tools
- **forge**: Smart contract compilation and testing
- **anvil**: Local Ethereum node for testing
- **cast**: CLI for Ethereum RPC calls
- **chisel**: Solidity REPL

### Node.js Packages
- express: Web server
- ethers: Ethereum library
- typescript: TypeScript compiler
- And other dependencies in `cloud-fabric/package.json`

## System Requirements

- **OS**: Linux, macOS, or WSL2 on Windows
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB free space
- **Internet**: Required for initial setup

## Next Steps

After setup is complete:

1. Read [README.md](README.md) for project overview
2. Read [DEMO.md](DEMO.md) for detailed testing guide
3. Run `./test-local.sh` to verify everything works
4. Start building!

## Quick Reference Commands

```bash
# Build contracts
forge build

# Run tests
forge test -vv

# Start local blockchain
anvil

# Deploy contracts
forge script script/DeployScript.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast

# Start Cloud Fabric
cd cloud-fabric && DEMO_MODE=true npm run demo

# Run complete test suite
./test-local.sh
```

## Support

If you encounter issues:
1. Check this SETUP.md file
2. Review the [DEMO.md](DEMO.md) troubleshooting section
3. Ensure all prerequisites are installed correctly
4. Try cleaning and rebuilding: `forge clean && forge build`
