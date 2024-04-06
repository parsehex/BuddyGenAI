# Check if the directory whisper.cpp exists
if (!(Test-Path -Path whisper.cpp)) {
	# Clone the repository if the directory does not exist
	git clone https://github.com/ggerganov/whisper.cpp
}

# Change the current directory to whisper.cpp
Set-Location -Path whisper.cpp

# Create the build directory if it does not exist
if (!(Test-Path -Path build)) {
	New-Item -ItemType Directory -Path build
}

# Change the current directory to build
Set-Location -Path build

# Build
cmake .. -DWHISPER_CUDA=ON
cmake --build . --config Release
