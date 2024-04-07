if (-not (Test-Path -Path "whisper.cpp")) {
	$userInput = Read-Host "Do you want to setup whisper.cpp? (y/n)"
	if ($userInput -match "^[Yy]$") {
		.\scripts\windows\setup_whispercpp.ps1
	} else {
		exit
	}
}

Set-Location -Path "whisper.cpp\build\bin"

# TODO how to acquire/specify model
.\server
