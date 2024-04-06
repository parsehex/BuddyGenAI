# Check if the directory stable-diffusion.cpp exists
if (!(Test-Path -Path stable-diffusion.cpp)) {
	# Clone the repository if the directory does not exist
	git clone --recursive https://github.com/leejet/stable-diffusion.cpp
}

# Change the current directory to stable-diffusion.cpp
Set-Location -Path stable-diffusion.cpp

# Create the build directory if it does not exist
if (!(Test-Path -Path build)) {
	New-Item -ItemType Directory -Path build
}

# Change the current directory to build
Set-Location -Path build

# Build
cmake .. -DSD_CUBLAS=ON
cmake --build . --config Release
