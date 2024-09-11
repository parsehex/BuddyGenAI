# Get Models for BuddyGenAI

View the current version of this page [here](https://github.com/parsehex/BuddyGenAI/blob/main/docs/getting-models.md).

BuddyGenAI uses AI models to chat, generate text, images, TTS and Speech-to-Text. TTS and Speech-to-Text are optional, but you're required to provide a chat and an image model.

## Compatibility

You'll need to determine what models your GPU is able to run. The less VRAM your GPU has, the smaller the model you'll need to use. You might be able to run larger models on a GPU with less VRAM, but it will be slower and may crash.

First, check how much VRAM your GPU has. You can do this by opening Task Manager, going to the Performance tab, and clicking on GPU. You'll see a graph of your GPU usage and the amount of VRAM your GPU has. Note how much VRAM you have available.

The following sections provide estimates of the VRAM required for each model. The list of models is not exhaustive but are the models I've used with the app (RTX 3060 12GB).

The app expects the following file extensions for models:

- Chat Model: `.gguf`
- Image Model: `.safetensors`
- TTS Voice: `.onnx` and adjacent `.json`
- Speech-to-Text Model: `.bin`

## Chat Models (Required)

My preferred chat model has been Meta's Llama 3. You can find links to download quanized/smaller versions of the model below.

(The higher the number e.g. Q8, the better the model, but the more VRAM it will require.)

| Model | File Size | Est. VRAM Usage |
| --- | --- | --- |
| [Q2_K](https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF/blob/main/Meta-Llama-3-8B-Instruct-Q2_K.gguf) | 3.17GB | 4.5GB |
| [Q4_K_M](https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF/blob/main/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf) | 4.92GB | 5.9GB |
| [Q8_0](https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF/blob/main/Meta-Llama-3-8B-Instruct-Q8_0.gguf) | 8.54GB | 9.1GB |

## Image Model (Required)

I've been using Toonify SD 1.5.

| Model | File Size | Est. VRAM Usage |
| --- | --- | --- |
| [Toonify SD 1.5](https://civitai.com/api/download/models/244831) | 1.98GB | 3GB |

## TTS Voices (Optional)

The app uses [Piper TTS](https://github.com/rhasspy/piper) which uses the CPU and is not very resource-intensive. Here are resources to find voices:

- [Piper TTS Voice Samples](https://rhasspy.github.io/piper-samples/)

When importing a voice, you'll need to down load and select both a `.onnx` and `.json` file. The `.json` file's name should include the full name of the `.onnx` file (e.g. `en_US-lessac-medium.onnx` and `en_US-lessac-medium.onnx.json`).

## Speech-to-Text Models (Optional)

I've been using the Distill-Whisper large-v3 model for increased speeds and lower VRAM usage.

To download, go to the link below and click the "Files and versions" tab, then click on the file "ggml-distil-large-v3.bin" and finally click on Download.

| Model | File Size | Est. VRAM Usage |
| --- | --- | --- |
| [Distill-Whisper large-v3](https://huggingface.co/distil-whisper/distil-large-v3-ggml) | 1.52GB | ??GB |
