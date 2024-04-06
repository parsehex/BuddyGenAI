#!/bin/bash

# if theres no llama.cpp dir:
if [ ! -d "llama.cpp" ]; then
	git clone https://github.com/ggerganov/llama.cpp
fi

cd llama.cpp

# create build dir
mkdir -p build
cd build

# build
cmake .. -DLLAMA_CUDA=ON
cmake --build . --config Release
