if (-not (Test-Path -Path "llama.cpp")) {
	$userInput = Read-Host "Do you want to setup llama.cpp? (y/n)"
	if ($userInput -match "^[Yy]$") {
		.\scripts\windows\setup_llamacpp.ps1
	} else {
		exit
	}
}

Set-Location -Path "llama.cpp\build\bin"

.\server -m /media/user/ML/LLaMA/openchat-3.5-1210.Q5_K_M.gguf --n-gpu-layers 35
