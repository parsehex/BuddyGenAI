#!/bin/bash

if [ ! -d "llama.cpp" ]; then
	read -p "Do you want to setup llama.cpp? (y/n) " -n 1 -r
	echo
	if [[ $REPLY =~ ^[Yy]$ ]]; then
		./scripts/linux/setup_llamacpp.sh
	else
		exit 0
	fi
fi

cd llama.cpp/build/bin

./server -m /media/user/ML/LLaMA/openchat-3.5-1210.Q5_K_M.gguf --n-gpu-layers 35 -c 4096
