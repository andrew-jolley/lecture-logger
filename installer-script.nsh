; Custom NSIS script for Lecture Logger
; This script handles proper app closure detection and killing processes

!include "MUI2.nsh"

; Function to kill processes using taskkill command
Function KillLectureLoggerProcesses
  DetailPrint "Checking for running Lecture Logger processes..."
  
  ; Kill Lecture Logger processes using taskkill
  nsExec::ExecToLog 'taskkill /F /IM "Lecture Logger.exe" /T'
  Pop $0 ; Get return code (0 = success, 128 = not found, other = error)
  
  ; Kill any lingering electron processes that might be from our app
  nsExec::ExecToLog 'taskkill /F /IM "electron.exe" /T'
  Pop $0
  
  ; Wait a moment for processes to terminate
  Sleep 2000
  
  DetailPrint "Process cleanup completed."
FunctionEnd

; Custom pre-install function
!macro customInit
  DetailPrint "Preparing installation..."
  Call KillLectureLoggerProcesses
!macroend

; Custom pre-uninstall function  
!macro customUnInit
  DetailPrint "Preparing uninstallation..."
  Call KillLectureLoggerProcesses
!macroend

; Custom install mode
!macro customInstallMode
  ; Set to current user context for better compatibility
  SetShellVarContext current
!macroend

; Additional custom installer behavior
!macro customHeader
  !system "echo Lecture Logger Custom Installer"
!macroend

; Handle upgrade scenario specifically
!macro customInstall
  ; Additional process cleanup before file operations
  DetailPrint "Ensuring clean installation environment..."
  Call KillLectureLoggerProcesses
  
  ; Clear any locks on the installation directory
  RMDir /r "$INSTDIR\*.tmp"
  Delete "$INSTDIR\*.lock"
!macroend