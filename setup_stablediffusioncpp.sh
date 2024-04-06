#!/bin/bash

if [ ! -d "stable-diffusion.cpp" ]; then
	git clone --recursive https://github.com/leejet/stable-diffusion.cpp
fi

cd stable-diffusion.cpp

# create build dir
mkdir -p build
cd build

# build
cmake .. -DSD_CUBLAS=ON
cmake --build . --config Release
