# BuddyGen AI

Electron app using llama.cpp and stable-diffusion.cpp to generate Buddies to talk to.

## ✅ Features

- Generate Buddies to talk to 🤖
- Create a detailed Buddy from just a few words 📝
  - Or customize your Buddy to behave exactly how you want 🎨
- Generate profile pictures for your Buddy 🖼️

# ⚙️ Setup

Node v18 is recommended.

You'll need to download the latest release of [LlamaFile](https://github.com/Mozilla-Ocho/llamafile). Place the binary at `./binaries/llamafile` and make it executable (for Windows: add ".exe" to the end of the file's name).

```bash
git clone https://github.com/parsehex/BuddyGenAI

cd BuddyGenAI

# Install dependencies
npm install

# ./scripts/[linux or windows]/setup_llamacpp.[sh or ps1]
./scripts/[linux or windows]/setup_stablediffusioncpp.[sh or ps1]
# ./scripts/[linux or windows]/setup_whispercpp.[sh or ps1]

# Start the app in development mode (in electron)
npm run dev:electron

code .
```

# 📡 Usage

### Development

Commonly Used Scripts:

```bash
# Start the app in development mode (in electron)
npm run dev:electron
# 'npm run dev:electron:win' for windows

# same as dev:electron but deletes db first
npm run reset-dev
# npm run reset-dev:win

# Start the app in development mode (in browser)
npm run dev
```

# License

BuddyGen AI - An app to generate AI-powered companions to talk to. Copyright (C) 2024 Thomas Mays

This program is licensed under the GNU Affero General Public License version 3. See the LICENSE file for more details.
