# BuddyGenAI

BuddyGenAI is an offline-only chat app made to create and interact with virtual buddies. BuddyGenAI uses the following local AI projects:

- [llama.cpp](https://github.com/ggerganov/llama.cpp)
- [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp)
- [Piper](https://github.com/rhasspy/piper)
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp)

## ✅ Features

- Create, manage and chat with buddies 🤖
- Generate profile pictures for your buddies
- Hear buddies with text-to-speech
- Speak messages to buddies with speech-to-text
- Buddies can send images in chat 🖼️
- Completely offline and private

## ⚙️ Setup

[Getting Started Instructions](https://github.com/parsehex/BuddyGenAI/blob/main/docs/getting-started.md)

BuddyGenAI is in pre-release stage and so the experience will be unstable at times. If you encounter any issues, please report them on the [issues page](https://github.com/parsehex/BuddyGenAI/issues).

You may [check the releases page](https://github.com/parsehex/BuddyGenAI/releases) to get a pre-built version of the app, or follow the section below to build it yourself.

**Note**: You'll need AI model files in order to use the app. These are not included in the app due to their size. You can find models that I recommend on [this page](https://github.com/parsehex/BuddyGenAI/blob/main/docs/getting-models.md).

## ❓ Support / Help

If you find an issue with the app, please report it on the [issues page](https://github.com/parsehex/BuddyGenAI/issues). If you need help setting up the app or anything else, feel free to ask on the [discussions page](https://github.com/parsehex/BuddyGenAI/discussions).

## Build Guides

- [Building on Windows for NVIDIA GPU](https://github.com/parsehex/BuddyGenAI/blob/main/docs/building_windows_nvidia.md)

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

## Developer Notes

- There are 2 `AppSettings.ts` files. One in `electron/` and one in `lib/api/`. The electron one is to get settings when running LlamaFile/SDCPP and so it doesn't do any saving of settings. The one in `lib/api/` is for the app UI and does save settings.
  - Additionally, `stores/main.ts` includes a copy of the Settings interface and thus also needs updated when changes are made to `AppSettings.ts`.
- Apologies for the lack of testing and the overall messiness of the project.
  - Several refactors are needed.
    - Lots of duplicated code (AppSettings, anything else shared between electron/client)
    - Project minimally uses Vercel's AI SDK (really just for message streaming), I want to re-implement to avoid the need for a server (just llama.cpp server then) and reduce dependencies.
    - Accessing data from db is a mess, want to use [tRPC](https://trpc.io/) with electron's IPC to reduce complexity.
  - Planning to use [Vitest](https://vitest.dev/) for testing before undergoing major refactors.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

Copyright (C) 2024 Thomas Mays

All AI Models are licensed under their respective licenses. See the [Licenses](./licenses/) folder for more details.
