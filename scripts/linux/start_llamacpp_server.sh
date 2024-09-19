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

# TODO pick chat template automatically

./server -m /media/user/ML/LLaMA/WizardLM-2-7B-Q5_K_M.gguf --n-gpu-layers 35 -c 4096 --chat-template vicuna
