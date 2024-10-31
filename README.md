# BuddyGenAI

BuddyGenAI is an offline-only chat app made to create and interact with virtual buddies. BuddyGenAI uses the following local AI projects:

- [llama.cpp](https://github.com/ggerganov/llama.cpp)
- [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp)
- [Piper](https://github.com/rhasspy/piper)
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp)

This is a passion project of mine to create an experience that somewhat realistically emulates having virtual friends to talk to and interact with. The above projects and several others have helped make this possible and I couldn't have made this without their work. I hope others find this project interesting and enjoyable as well.

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

**Note**: You'll need AI model files in order to use the app. These are not included in the app itself. You can find models that I recommend on [this page](https://github.com/parsehex/BuddyGenAI/blob/main/docs/getting-models.md).

## Troubleshooting

**Chat keeps starting forever**

This happens occasionally and I think is a frontend issue. First, try pressing Ctrl+R to refresh the app. If that doesn't work, restarting the app should fix the issue.

## ❓ Support / Help

If you find an issue with the app, please report it on the [issues page](https://github.com/parsehex/BuddyGenAI/issues). If you need help setting up the app or anything else, feel free to ask on the [discussions page](https://github.com/parsehex/BuddyGenAI/discussions).

## Build Guides

- [Building on Windows for NVIDIA GPU](https://github.com/parsehex/BuddyGenAI/blob/main/docs/building_windows_nvidia.md)
- Linux, Mac
  - Instead of using the `cuda12` folder for the `*.cpp` projects, simply place a `koboldcpp` binary in the `binaries-{linux | darwin}` folder.

## Future Plans

My overall goal with this is ease and simplicity for the user. While I am interested in LLMs and imagegen models, I wanted to make an app that is more about creating an interesting experience that's jargon-free and approachable to those with novice computer skills.

Aside from overall cleaning up the project and improving the look of it, I have some ideas for larger features to improve quality or increase immersion:

(all of these would be optional and/or able to be disabled in settings)

- Topics: A form of RAG that I want to implement. This would allow buddies to learn things about you and recall it across chats.
- Games: Text adventure games involving your buddy sounds fun to me and I have some ideas that I think would make for an interesting experience.
- More variety to chats:
  - Delays in responses: Buddies would (occasionally) take longer to respond to messages based on the chat's context or random events.
  - Buddies go Idle: Sometimes, a buddy might "go away" and not respond to messages for a while.
- Random Buddy Encounters: The app creates a new buddy in the background and the user has the option to add them to their buddy list.
  - Current buddies might even be the ones to introduce the new buddy to the user.
- Group Chats: Chat with multiple buddies at once.

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
