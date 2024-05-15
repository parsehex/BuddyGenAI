BuddyGenAI is a chat application designed to create and interact with virtual buddies

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

# Developer Notes

- There are 2 `AppSettings.ts` files. One in `electron/` and one in `lib/api/`. The electron one is to get settings when running LlamaFile/SDCPP and so it doesn't do any saving of settings. The one in `lib/api/` is for the app UI and does save settings.
  - Additionally, `stores/main.ts` includes a copy of the Settings interface and thus also needs updated when changes are made to `AppSettings.ts`.

# License

BuddyGen AI - An app to generate AI-powered companions to talk to. Copyright (C) 2024 Thomas Mays

This program is licensed under the GNU Affero General Public License version 3. See the LICENSE file for more details.
