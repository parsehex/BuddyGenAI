# BuddyGen AI

Electron app using llama.cpp and stable-diffusion.cpp to generate Buddies to talk to.

## ✅ Features

- Generate Buddies to talk to 🤖
- Create a detailed Buddy from just a few words 📝
  - Or customize your Buddy to behave exactly how you want 🎨
- Generate profile pictures for your Buddy 🖼️

# ⚙️ Setup

Building is not stable yet.

Linux is my daily driver, so I haven't kept the Windows bulid scripts in `./scripts` up to date. I had it working when I wrote the scripts but haven't circled back to it since.

Node v18 is recommended.

```bash
git clone https://github.com/parsehex/BuddyGenAI

cd BuddyGenAI

# Install dependencies
npm install

./scripts/[linux or windows]/setup_llamacpp.[sh or ps1]
./scripts/[linux or windows]/setup_stablediffusioncpp.[sh or ps1]
# ./scripts/[linux or windows]/setup_whispercpp.[sh or ps1]

# Start the app in development mode (in electron)
npm run dev:electron

code .
```

## Windows Notes

- I'm starting on node v18
- Does `spawn` work on Windows where `fork` doesn't in prod?

# 📡 Usage

### Development

Commonly Used Scripts:

```bash
# in dev, we use external llamacpp server due to restarts, so start that:
npm run llamacpp:linux
# 'npm run llamacpp:win' for windows

# Start the app in development mode (in electron)
npm run dev:electron
# 'npm run dev:electron:win' for windows

# same as dev:electron but deletes db
npm run reset-dev
# npm run reset-dev:win

# Start the app in development mode (in browser)
npm run dev
```

### Build

```bash
# Generate Nuxt static build
npm run build

# Call the appropriate setup_llamacpp and setup_stablediffusioncpp scripts before building
# 	(if making a local only build that is -- only kind supported atm)

# Build electron app for production
npm run build:electron
```

# License

BuddyGen AI - An app to generate AI-powered companions to talk to. Copyright (C) 2024 Thomas Mays

This program is licensed under the GNU Affero General Public License version 3. See the LICENSE file for more details.
