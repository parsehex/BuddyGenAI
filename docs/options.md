# buddyGenAI Options

## General

- **Tab Icons**: Whether to display icons for the sidebar tabs. Disable to show text labels instead.
- **Color Mode**: Whether to use **Light** or **Dark** mode, or use the **System-preferred** mode.
- **Your Name**: This will show up in-chat and control how your buddies refer to you.
- **Profile Image**: Set a profile image for yourself to show in chat messages.
- **Your Description**: Info about you/the user, which will be provided for extra context when chatting with buddies or the Assistant.
<!-- - Show description to: Control whether your description is shown to the Assistant or (all) Buddies
  - Assistant
  - Buddies -->

## AI Providers

At the top of this section, you'll find 4 dropdowns for the features the app supports, allowing you to set which provider handles certain things or Disable them.

These dropdowns and their supported providers are:

- **Chat**: KoboldCpp / WebLLM / OpenRouter
- **Image**: KoboldCpp / SwarmUI
- **TTS**: KoboldCpp
- **Transcription**: KoboldCpp

Providers that are selected above will display below in order to configure them. Below is info about how each AI Provider can be configured in this panel:

- **KoboldCpp**: Currently you can just set a **Host** (if you're using something besides the default). Once a valid Host is set, you should see a list of features that the KoboldCpp instance supports.
  - **SwarmUI** preliminary support is added as an alternative option for local image generation. Like with Kobold, you are able to only set a **Host** as an option at this time.
- **WebLLM**: If enabled, then a dropdown and button will be available to choose and load a chat model (which will be downloaded the first time, should load faster next time)
- **OpenRouter**: If enabled, a text box will display to view or edit your connected API key. If there's no API key value in the box, then a "Connect to OpenRouter" button which will take you to <https://openrouter.ai> to login & get an API key.

## Chat

- **Stream AI Responses**: Control whether messages are typed out as it's received. When disabled, Assistant/Buddy messages will show `{Name} is typing...` until the entire message is received.

## Image

- **Enable Chat Images**: Experimental feature to allow generating an image for any AI message. Generated images are at 512x768 resolution instead of the square 512px used for profile pictures. When enabled:
  - You'll see an extra option **Chat Image Quality** which changes how many steps are used to generate images.
    - `low` = 16 steps
    - `medium` = 24 steps
    - `high` = 32 steps
  - You'll now have an image button available on buddy and assistant messages, which will begin loading an image once clicked.
  - This feature is experimental because the resulting prompt/image is generally not the most contextually sensible.

## Voice

### Text-to-Speech

- Default Voice
- Auto-Read Chat: Once messages are received, automatically generate & play them with TTS.

### Transcription

- Auto-Send after recording: Whether to automatically send your input after recording + transcription is finished.

<!-- ## Experimental -->
