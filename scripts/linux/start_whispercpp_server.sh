#!/bin/bash

if [ ! -d "whisper.cpp" ]; then
	read -p "Do you want to setup whisper.cpp? (y/n) " -n 1 -r
	echo
	if [[ $REPLY =~ ^[Yy]$ ]]; then
		./scripts/linux/setup_whispercpp.sh
	else
		exit 0
	fi
fi

cd whisper.cpp/build/bin

# TODO how to acquire/specify model?
./server
