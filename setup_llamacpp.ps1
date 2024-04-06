# Check if the directory llama.cpp exists
if (!(Test-Path -Path llama.cpp)) {
	# Clone the repository if the directory does not exist
	git clone https://github.com/ggerganov/llama.cpp
}

# Change the current directory to llama.cpp
Set-Location -Path llama.cpp

# Create the build directory if it does not exist
if (!(Test-Path -Path build)) {
	New-Item -ItemType Directory -Path build
}

# Change the current directory to build
Set-Location -Path build

# Build
cmake .. -DLLAMA_CUDA=ON
cmake --build . --config Release
