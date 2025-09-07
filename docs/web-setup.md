# Getting Started with buddyGenAI (Web version)

This guide will walk you through the process of to setting up buddyGenAI to be able to chat, generate images and speech, as well as the option to use voice input instead of typing messages.

buddyGenAI is designed for you to Bring Your Own AI, which this guide should help you with.

## AI Provider Compatibility

To use the core of the app, you'll need to setup at least **chat AI**, which currently supports choosing 1 from 3 providers:

- [**KoboldCpp**][kcpp] (Chat / Image / TTS / Transcription): Supports [Windows][kcpp-win], [Mac][kcpp-mac] and [Linux][kcpp-lin]
- [**WebLLM**][webllm] (Chat only): Run chat models within your browser (supports Chrome-like browsers)
- [**OpenRouter**][OR] (Chat only): If you can't run models on your own hardware, this is less private but provides an alternate option to use the app. Requires signing up and managing payment info with OpenRouter.

[kcpp]: https://github.com/LostRuins/koboldcpp
[kcpp-win]: https://github.com/LostRuins/koboldcpp#windows-usage-precompiled-binary-recommended
[kcpp-mac]: https://github.com/LostRuins/koboldcpp#macos-precompiled-binary
[kcpp-lin]: https://github.com/LostRuins/koboldcpp#linux-usage-precompiled-binary-recommended
[webllm]: https://webllm.mlc.ai/
[OR]: https://openrouter.ai/

## Installation and Setup

<!-- TODO run thru the app setup -->

(_Sorry this is incomplete - I ran out of steam in the middle of writing this._)

## Chatting

After creating a buddy, you'll be taken to a new chat with them. To create a new chat, go to the Chat tab and select a buddy from the dropdown to the right of the `Chat with:` label.

### Text-to-Speech

If you've imported TTS voice(s) then you can click the speaker icon on AI messages to have them spoken out loud. You can set buddies to have a specific voice by going to the buddy's Edit page.

You can have message auto-speak by going to the Settings tab -> `Text-to-Speech Options` and enabling the option "Auto Read Chat".

### Voice Input / Transcription

If you've imported an STT model, you can click the microphone icon in the chat input, speak your message and click the microphone icon again to have your speech converted to text.

> [!NOTE] Want to save a click?
>
> You can automatically send messages after transcription by going to `Options` -> `Voice` -> `Transcription` and enabling the option **Auto-Send after recording**.
>
> With this enabled, clicking the Stop Recording button will automatically send your message once the audio is transcribed.

### Enable (AI-sent) Chat Images

Chat images are disabled by default. To enable them, go to `Options` -> `Experimental` and then click "Enable Chat Images" and optionally change the quality dropdown under it, which will affect the quality and speed of the images generated.

With the option enabled, any AI in the app may generate and send images based on the chat's context.

### Changing Models

You may change and import AI models by going to the Settings tab.

Note that if you change the chat model then you'll need to restart the app or use the in-app control to restart the chat model (through the Chat tab -> click "Chat Online").
