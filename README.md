# BuddyGenAI (prototype)

BuddyGenAI is an app made to create and interact with virtual buddies, with options to use AI models running locally or from cloud providers (more AI provider support in progress).

In the app, you name your buddies as well as give them a description to influence how they chat with you. When you're connected to image AI,, you can generate profile pictures for your buddies which display in chat.

This is a passion project of mine to create an experience that emulates having friends to talk to and hang out with. The above projects and several others have helped make this possible and I couldn't have made this without their work.

I hope others find this project interesting and/or enjoyable as well.

[Go to the app here](https://app.buddygenai.com/)

> ![NOTE]
> The original iteration of this app used Electron with embedded AI engines but I'm not updating it for now. The branch with that version in tact is [available here](https://github.com/parsehex/BuddyGenAI/tree/main).

## ✅ Features

- Create, manage and chat with buddies 🤖
- [KoboldCpp](https://github.com/LostRuins/koboldcpp) integration
  - Generate profile pictures for your buddies (or set them manually)
  - Hear buddies with text-to-speech 🔊
  - Speak messages to buddies with speech-to-text
  - Buddies can send images in chat 🖼️ (experimental, off by default)
- Can also use [OpenRouter](https://openrouter.ai/) or [WebLLM](https://webllm.mlc.ai/) (Chrome/Edge only) for chat
- Completely offline and private: besides your AI provider, app data isn't sent anywhere
  - PWA support is planned

## ❓ Support / Help

If you find an issue with the app, please open an issue about it on the [issues page](https://github.com/parsehex/BuddyGenAI/issues). If you need help using or setting up the app, feel free to ask on the [discussions page](https://github.com/parsehex/BuddyGenAI/discussions).

## Future Plans

My overall goal with this is ease and simplicity for the user. While I'm interested in LLMs and imagegen models, I wanted to make an app that's more about creating an interesting experience that's jargon-free (or -minimal) and approachable to those with novice computer skills. Of course there are better and more polished options as far as easy: [Jan](https://jan.ai/) or [LM Studio](https://lmstudio.ai/) are popular & easy interfaces to use chat models, but I wanted the full chat experience, plus making it myself so that I know how it works.

Aside from overall cleaning up the project and improving the look of it, I have some ideas for larger features to improve quality or increase immersion:

(all of these would be optional and/or able to be disabled in settings)

- Topics: A form of RAG that I want to implement. This would allow buddies to learn things about you and recall it across chats.
- Games: Text adventure games involving your buddy sounds fun to me and I have some ideas that I think would make for an interesting experience.
- More variety to chats:
  - Delays in responses: Buddies would (occasionally) take longer to respond to messages based on the chat's context or random events.
  - Buddies go Idle: Sometimes, a buddy might "go away" and not respond to messages for a while.
- Random Buddy Encounters: The app creates a new buddy in the background and the user has the option to add them to their buddy list.
  - Current buddies might even be the ones to introduce the new buddy to the user.
  - Or there could be an in-app notification about a message from a potential new Buddy (complete with a generated appearance if supported). Plenty of options to control the behavior.
- Group Chats: Chat with multiple buddies at once.

## Developer Notes

- I haven't fully deleted `electron/` and refactored away from
- Apologies for the lack of testing and the overall messiness of the project.
  - Several refactors are needed.
    - Lots of duplicated code (AppSettings, anything else shared between electron/client)
    - Project minimally uses Vercel's AI SDK (really just for message streaming), I want to re-implement to avoid the need for a server (just llama.cpp server then) and reduce dependencies.
    - Accessing data from db is a mess, want to use [tRPC](https://trpc.io/) with electron's IPC to reduce complexity.
  - Planning to use [Vitest](https://vitest.dev/) for testing before undergoing major refactors.

## Collaborators Welcome!

If you'd like to contribute or otherwise help make this app, I look forward to hearing from you! Please drop an issue in the repository or any other way you can find to contact me.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

Copyright (C) 2024-2025 Thomas Mays

All AI Models are licensed under their respective licenses. See the [Licenses](./licenses/) folder for more details.
