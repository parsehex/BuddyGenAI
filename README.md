BuddyGenAI is a chat application designed to create and interact with virtual buddies.

The app is built for my own use mainly and as such I don't plan to publicly share builds of the app. However, I attempt to keep the build instructions up-to-date -- again, for myself but also for anyone else with the know-how to build the app as well.

## Motivation / Purpose / Next Iteration

<!-- this won't be well-structured at first but i kinda keep forgetting why this app exists -->

While this app may be better as a web app that is easily accessible on different platforms, this iteration of BuddyGenAI was made to provide a seamless and simple experience for users to be able to download an app to get access to local AI models. I wanted something that could be built and given to friends on a flash drive which would have everything to get going with a talking and listening AI buddy that has a visual representation. This is my own take on creating an app using 4 these forms of AI, packaged up in a way that is easy to use and share as well as extend by using other models.

The next iteration of this might be better suited as a multi-user web app (with a single-user mode?) that serves approximately the same interface as the current app. The app would be installed on the machine with the appropriate hardware and would act as the server for clients to connect to.

We could shed the electron dependency and use a web server to serve the app. I guess we'd put server administration/maintenance in the web interface for the admin user. The admin user would be able to add/remove models, manage users, and view logs (eventually).

Now that I think about it, I think this would open up the possibility to do the idea I've had to have buddies initiate conversation and have the user get a push notification when they do. There's a lot of details to work out like avoiding spamming the user or having unmanageable background performance.

With it being a server, it makes sense to allow just disabling certain features like Imagen or TTS. A server might be a better form form BuddyGenAI as it still does require some knowledge to setup and configure depending on the user's hardware or preferences. Could also have controls to set limitations on what you can make with Imagen for instance (i.e. parental / content controls would be more attainable since there would be actual access control).

I think I need to consult an AI on this, but I think we can use Supabase to handle a lot of the access control with users and roles. Using a starter app would go a long way. It should have:

- Admin-only section
- Database (ideally that's actually being used for something)
- Auth ofc

Maybe find a multi-user chat app that uses supabase?

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

First, you'll need to create a `./binaries/` folder in the root of the project. Now, download the latest release of [Piper](https://github.com/rhasspy/piper/releases) and extract the contents to the `./binaries` folder.

Next, you'll need one or more of the following folders within the `./binaries/` folder:

- `cuda12`
- `rocm5.5`
- `clblast`
- `vulkan`
- `avx512`
- `avx2`
- `avx`
- `noavx`

These will be checked at runtime in the order listed above. Within each of these folders, you'll need the following binaries:

- `ggml_shared.dll`
- `llama.dll`
- `llamacpp-main.exe`
- `llamacpp-server.exe`
- `stable-diffusion.dll`
- `stable-diffusioncpp-sd.exe`
- `whisper.dll`
- `whispercpp-main.exe`
- **Important**: Include license files (e.g. `ggml.txt`) when redistributing your build.

The `cuda12` folder should also contain the files contained within one of the `cudart-llama-bin-win-cuXX.x.x-x64.zip` files from the [LlamaFile releases page](https://github.com/ggerganov/llama.cpp/releases). These files will be used for all of the binaries that are CUDA-capable.

### Steps to Build / Develop BuddyGenAI

Node v18+ is recommended. I personally use [nvm](https://github.com/nvm-sh/nvm) or [NVM for Windows](https://github.com/coreybutler/nvm-windows) to manage Node versions.

```bash
git clone https://github.com/parsehex/BuddyGenAI

cd BuddyGenAI

# Install dependencies
npm install

# Start the app in development mode (in electron)
npm run dev:electron # or `npm run dev:electron:win` for windows
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
