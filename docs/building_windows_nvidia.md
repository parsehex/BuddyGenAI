# Building BuddyGenAI on Windows for NVIDIA GPUs

This guide will walk you through the process of building BuddyGenAI on Windows for NVIDIA GPUs with CUDA acceleration.

This is the setup that I have been using so I would expect it to work for you as well. If you have any issues or need help with any details, please let me know so that I can update this guide.

## Prerequisites

- [Microsoft Visual C++ Redistributable x64](https://aka.ms/vs/17/release/vc_redist.x64.exe)
- Node v20
  - Install [NVM for Windows](https://github.com/coreybutler/nvm-windows/releases)
  - Run `nvm install 20` and then `nvm use 20`, and restart your terminal
- [CUDA Toolkit](https://developer.nvidia.com/cuda-downloads)\
  - Optional if you download and use the `cudart*` zip below.

## Acquire Binaries

First, you'll need to download or build binary files that BuddyGenAI relies on. The latest versions _should_ work, although you may need to check the date of BuddyGenAI's latest release to find the right version of any binaries that are not working.

You'll need the following project's binaries:

- [llama.cpp](https://github.com/ggerganov/llama.cpp/releases)
  - Download the latest release's `llama-*-bin-win-cuda-cu12.2.0-x64.zip`
  - Download `cudart-llama-bin-win-cu12.2.0-x64.zip` if you did not install CUDA Toolkit
- [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp/releases)
  - Download the latest release's `sd-master-*-bin-win-cuda12-x64.zip`
- [Piper](https://github.com/rhasspy/piper/releases)
  - Download the latest release's `piper_windows_amd64.zip`
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp/releases)
  - (not all releases have CUDA builds)
  - Download the latest release's `whisper-cublas-12.2.0-bin-x64.zip`

Now, create a `binaries` folder in the root of the project with a folder called `cuda12` inside it. Extract the contents of the Piper zip into the `binaries` folder. Extract the contents of the rest of the zips into the `cuda12` folder. You'll need to rename the \*.exe files for `llama.cpp`, `stable-diffusion.cpp`, and `whisper.cpp` to match the expected names below.

The following is the expected structure of the `binaries` folder:

```
binaries/
├─ cuda12/
│  ├─ cublas64_12.dll
│  ├─ cublasLt64_12.dll
│  ├─ cudart64_12.dll
│  ├─ ggml.dll
│  ├─ ggml_shared.dll
│  ├─ llama.dll
│  ├─ llamacpp-main.exe
│  ├─ llamacpp-server.exe
│  ├─ stable-diffusion.dll
│  ├─ stable-diffusioncpp-sd.exe
│  ├─ whisper.dll
│  ├─ whispercpp-main.exe
├─ espeak-ng-data/
│  ├─ ...
├─ pkgconfig/
├─ espeak-ng.dll
├─ libtashkeel_model.ort
├─ onnxruntime.dll
├─ onnxruntime_providers_shared.dll
├─ piper.exe
├─ piper_phonemize.dll
```

## Build BuddyGenAI

```
git clone https://github.com/parsehex/BuddyGenAI
cd BuddyGenAI
npm install
npm run build:electron
```

After building completes, you can find a setup `.exe` in the `electron-dist` folder.
