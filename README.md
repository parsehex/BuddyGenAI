BuddyGenAI is a chat application designed to create and interact with virtual buddies

## ✅ Features

- Generate Buddies to chat with 🤖
- Create a detailed Buddy from just a few words 📝
  - Or customize your Buddy to behave exactly how you want 🎨
- Generate profile pictures for your Buddy 🖼️

## Support / Help

If you find an issue with the app, please report it on the [issues page](https://github.com/parsehex/BuddyGenAI/issues). If you need help setting up the app or anything else, feel free to ask on the [discussions page](https://github.com/parsehex/BuddyGenAI/discussions).

## ⚙️ Setup

BuddyGenAI is in pre-release stage and so the experience will be unstable at times. If you encounter any issues, please report them on the [issues page](https://github.com/parsehex/BuddyGenAI/issues).

You may [check the releases page](https://github.com/parsehex/BuddyGenAI/releases) to get a pre-built version of the app, or follow the section below to build it yourself.

## Building

(section is incomplete/outdated -- e.g. project is using llama.cpp again instead of llamafile)

### Acquiring Binaries

First you'll need to place binaries in the `./binaries/` folder. You can build them yourself or download them from their releases page. You'll need:

- [LlamaFile](https://github.com/Mozilla-Ocho/llamafile) - `./binaries/llamafile` or `./binaries/llamafile.exe`
- [Stable-Diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp) - You should at least have a `./binaries/stable-diffusion.cpp/cuda12` folder with the `stable-diffusion` binary in it. Besides `cuda12`, the following are also checked at runtime in this order:
  - rocm5.5
  - clblast
  - vulkan
  - avx512
  - avx2
  - avx
  - noavx

### Steps to Build BuddyGenAI

Node v18 is recommended. I personally use [nvm](https://github.com/nvm-sh/nvm) or [NVM for Windows](https://github.com/coreybutler/nvm-windows) to manage Node versions.

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
- Apologies for the lack of testing and the overall messiness of the project.
  - Several refactors are needed.
    - Lots of duplicated code (AppSettings, anything else shared between electron/client)
    - Project minimally uses Vercel's AI SDK (really just for message streaming), I want to re-implement to avoid the need for a server (just llama.cpp server then) and reduce dependencies.
    - Accessing data from db is a mess, want to use [tRPC](https://trpc.io/) with electron's IPC to reduce complexity.
  - Planning to use [Vitest](https://vitest.dev/) for testing before undergoing major refactors.

# License

This project is licensed under the MIT License. See the LICENSE file for more details.

Copyright (C) 2024 Thomas Mays

All AI Models are licensed under their respective licenses. See the [Licenses](./licenses/) folder for more details.
