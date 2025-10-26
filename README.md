# buddyGenAI

> [!NOTE]
> **See any potential here? Let me know / Spread the word!**
>
> I've been restoring + refurbishing my projects but I need users and feedback. If you have any interest in using this project, please get in touch via the _**Issues**_ tab or one of the links under _**Sponsor this project**_ to the right. [My profile](https://github.com/parsehex) may have updated contact info.

buddyGenAI is an app made to create and interact with virtual buddies, with options to use AI models running locally.

In the app, you name your buddies as well as give them a description to influence how they chat with you. When you're connected to image AI,, you can generate profile pictures for your buddies which display in chat.

This is a passion project of mine to create an experience that emulates having friends to talk to and hang out with. There are many projects and their work that have made this possible, so I encourage checking out the [licenses folder](./licenses/) as well as in-app, Settings tab -> **buddyGenAI Credits / Licenses**.

I hope others find this project interesting and/or enjoyable as well.

[Go to the app here](https://app.buddygenai.com/)

> [!NOTE]
>
> The original iteration of this app used Electron with embedded AI engines but I'm not updating it for now. The branch with that version in tact is [available here](https://github.com/parsehex/buddyGenAI/tree/main).

## ✅ Features

- Create, manage and chat with buddies 🤖
- [KoboldCpp](https://github.com/LostRuins/koboldcpp) integration
  - Generate profile pictures for your buddies (or set them manually)
  - Hear buddies with text-to-speech 🔊
  - Speak messages to buddies with speech-to-text
  - Buddies can send images in chat 🖼️ (experimental, off by default)
- Games: Go on a text adventure with your buddy
- You can also use [OpenRouter](https://openrouter.ai/) or [WebLLM](https://webllm.mlc.ai/) (Chrome/Edge only) for chat
- Completely offline and private: besides your AI provider, app data isn't sent anywhere

## Roadmap

These aren't necessarily confirmed, and completed lines aren't necessarily stable or working.

- [x] KoboldCpp support
  - [x] Chat
  - [x] Generate profile, chat images
  - [x] Read messages with TTS
  - [x] Transcribe from your microphone for hands-free messaging
- [ ] Fully in-browser AI
  - [x] Chat / LLM (via [WebLLM](https://webllm.mlc.ai/))
  - [ ] Images
  - [ ] TTS
    - [ ] Planned: [kokoro-js](https://www.npmjs.com/package/kokoro-js)
  - [ ] Transcription
- [ ] Games: Play a game while your buddy chats with you
  - _Work in progress_
- [ ] Install the app as a PWA
- [ ] Buddy/AI memory
  - Primitive version of this with Options -> General -> Your Description
- [ ] Buddy Encounters: Randomly-generated Buddies will show up, giving you the choice to Save or Ignore them.
  - The feature might be designed to emulate a friend-matching service.

## ❓ Support / Help

If you find an issue with the app, please open an issue about it on the [issues page](https://github.com/parsehex/buddyGenAI/issues). If you need help using or setting up the app, feel free to ask on the [discussions page](https://github.com/parsehex/buddyGenAI/discussions).

You're also welcome to join the [Discord server](https://discord.gg/wJ52aASf5b). As of now there isn't anything to it, but I'm happy to talk or offer support for the app.

## Future Plans

One of my overall goals with this is ease and simplicity for the user. While I'm interested in LLMs and imagegen models, I wanted to make an app that's more about creating an interesting experience that's jargon-free (or -minimal) and approachable to those with novice computer skills. There are better and more polished options which are easier to use overall: [Jan](https://jan.ai/) or [LM Studio](https://lmstudio.ai/) are popular & easy interfaces to use chat models, but I wanted the full chat experience, plus making it myself so that I know how it works.

Aside from overall cleaning up the project and improving the look of it, I have some ideas for larger features to improve quality or increase immersion:

(all of these would be optional and/or able to be disabled in settings)

- Topics: A form of RAG that I want to implement. This would allow buddies to learn things about you and recall it across chats.
- More variety to chats:
  - Delays in responses: Buddies would (occasionally) take longer to respond to messages based on the chat's context or random events.
  - Buddies go Idle: Sometimes, a buddy might "go away" and not respond to messages for a while.
- Random Buddy Encounters: The app creates a new buddy in the background and the user has the option to add them to their buddy list.
  - Current buddies might even be the ones to introduce the new buddy to the user.
  - Or there could be an in-app notification about a message from a potential new Buddy (complete with a generated appearance if supported). Plenty of options to control the behavior.
- Group Chats: Chat with multiple buddies at once.

## Developer Notes

- Apologies for the lack of testing and the overall messiness of the project.
  - Planning to use [Vitest](https://vitest.dev/) for testing one day.

## Collaborators Welcome!

If you'd like to contribute or otherwise help make this app, I look forward to hearing from you! Please drop an issue in the repository or any other way you can find to contact me.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

All AI Models are licensed under their respective licenses. See the [Licenses](./licenses/) folder for more details.
