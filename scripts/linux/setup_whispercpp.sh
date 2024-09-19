#!/bin/bash

if [ ! -d "whisper.cpp" ]; then
	git clone https://github.com/ggerganov/whisper.cpp
fi

cd whisper.cpp

# create build dir
mkdir -p build
cd build

# build
cmake .. -DWHISPER_CUDA=ON
cmake --build . -j --config Release

# TODO re-create symlinks to be actual copies (breaks electron-builder otherwise)
