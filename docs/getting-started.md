# Getting Started with BuddyGenAI

This guide should walk you through the process of to set up BuddyGenAI to be able to chat, generate images and speech, and be able to speak your messages using a microphone.

With BuddyGenAI, you have the ability to pick and choose which AI models you want to use which will affect the performance and quality of the application.

## Compatibility

First, your machine should have the following requirements:

- Windows 10 or later
  - Linux support is on the way
- Install [Microsoft Visual C++ Redistributable x64](https://aka.ms/vs/17/release/vc_redist.x64.exe)
- NVIDIA GPU with 6GB+ of VRAM (10-12GB is recommended)
  - RTX 20XX or newer is recommended
  - The more VRAM you have will allow for using better AI models
  - Install the latest NVIDIA drivers and [CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)
- Estimated 25GB of free disk space (rough estimate)

## Installation and Setup

1. Download and install the latest version of BuddyGenAI from the [releases page](https://github.com/parsehex/BuddyGenAI/releases).

2. Choose and download the AI models you want to use -- you can use [this page](https://github.com/parsehex/BuddyGenAI/blob/main/docs/getting-models.md) for model recommendations and download links.

3. Open BuddyGenAI and click the button to Import Models and select the model files you downloaded. Once done, click Continue and wait for the chat model to load before you see the next page.

   - If the model keeps loading, restarting the app may help. If that doesn't work, you may be missing Microsoft Visual C++ Redistributable x64 or CUDA Toolkit (see Compatibility section above).

4. The next page will ask for your name and then you'll provide info to make your first buddy. Give them a name and keywords that describe how they behave.

5. After you click Create Buddy, you'll be able to choose your buddy's appearance and generate a profile picture for them.
   - You can only choose 1 profile picture but all generated pictures can be seen by going to the buddy's Edit page.

## Chatting

After creating a buddy, you'll be taken to a new chat with them. To create a new chat, go to the Chat tab, select a buddy from the dropdown labelled `Start a chat with...` and click the `+` button to start a chat.

### Enable (AI-sent) Chat Images

Chat images are disabled by default. To enable them, go to the Settings tab -> `Image AI Options`. Click "Enable chat images" and optionally change the quality dropdown under it, which will affect the quality and speed of the images generated.

With the option enabled, any AI in the app may generate and send images based on the chat's context.

### Text-to-Speech

If you've imported TTS voice(s) then you can click the speaker icon on AI messages to have them spoken out loud. You can set buddies to have a specific voice by going to the buddy's Edit page.

You can have message auto-speak by going to the Settings tab -> `Text-to-Speech Options` and enabling the option "Auto Read Chat".

### Microphone Input / Speech-to-Text

If you've imported an STT model, you can click the microphone icon in the chat input, speak your message and click the microphone icon again to have your speech converted to text.

You can automatically send messages after converting speech to text by going to the Settings tab -> `Speech-to-Text Options` and enabling the option "Auto Send STT". Now, after you click to stop recording & transcription is finished, the message will be sent without needing to click the Send button.

### Changing Models

You may change and import AI models by going to the Settings tab.

Note that if you change the chat model then you'll need to restart the app or use the in-app control to restart the chat model (through the Chat tab -> click "Chat Online").
