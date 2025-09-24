; Custom NSIS script for Lecture Logger
; This script handles proper app closure detection and killing processes

!include "MUI2.nsh"
!include "FileFunc.nsh"

; Function to kill processes using taskkill command (for installer)
Function KillLectureLoggerProcesses
  DetailPrint "Checking for running Lecture Logger processes..."
  
  ; Kill Lecture Logger processes using taskkill (silent mode)
  nsExec::ExecToStack 'taskkill /F /IM "Lecture Logger.exe" /T'
  Pop $0 ; Get return code (0 = success, 128 = not found, other = error)
  Pop $1 ; Get output
  
  ; Kill any lingering electron processes that might be from our app
  nsExec::ExecToStack 'taskkill /F /IM "electron.exe" /T'
  Pop $0
  Pop $1
  
  ; Also kill any processes that might be locking files
  nsExec::ExecToStack 'taskkill /F /IM "node.exe" /T'
  Pop $0
  Pop $1
  
  nsExec::ExecToStack 'taskkill /F /IM "python.exe" /T'
  Pop $0
  Pop $1
  
  ; Wait longer for processes to terminate completely
  DetailPrint "Waiting for processes to terminate..."
  Sleep 3000
  
  DetailPrint "Process cleanup completed."
FunctionEnd

; Function to unlock files in installation directory
Function UnlockInstallationFiles
  DetailPrint "Unlocking installation files..."
  
  ; Try to remove read-only attributes
  nsExec::ExecToStack 'attrib -R "$INSTDIR\*.*" /S'
  Pop $0
  Pop $1
  
  ; Kill any handles to files in the installation directory
  nsExec::ExecToStack 'handle.exe -p "Lecture Logger" -y'
  Pop $0
  Pop $1
  
  Sleep 1000
FunctionEnd

; Function to kill processes using taskkill command (for uninstaller)
Function un.KillLectureLoggerProcesses
  DetailPrint "Checking for running Lecture Logger processes..."
  
  ; Kill Lecture Logger processes using taskkill (silent mode)
  nsExec::ExecToStack 'taskkill /F /IM "Lecture Logger.exe" /T'
  Pop $0 ; Get return code (0 = success, 128 = not found, other = error)
  Pop $1 ; Get output
  
  ; Kill any lingering electron processes that might be from our app
  nsExec::ExecToStack 'taskkill /F /IM "electron.exe" /T'
  Pop $0
  Pop $1
  
  ; Also kill any processes that might be locking files
  nsExec::ExecToStack 'taskkill /F /IM "node.exe" /T'
  Pop $0
  Pop $1
  
  nsExec::ExecToStack 'taskkill /F /IM "python.exe" /T'
  Pop $0
  Pop $1
  
  ; Wait longer for processes to terminate completely
  DetailPrint "Waiting for processes to terminate..."
  Sleep 3000
  
  DetailPrint "Process cleanup completed."
FunctionEnd

; Custom pre-install function
!macro customInit
  DetailPrint "Preparing installation..."
  Call KillLectureLoggerProcesses
  Call UnlockInstallationFiles
!macroend

; Custom pre-uninstall function  
!macro customUnInit
  DetailPrint "Preparing uninstallation..."
  Call un.KillLectureLoggerProcesses
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
  Call UnlockInstallationFiles
  
  ; Clear any locks on the installation directory
  RMDir /r "$INSTDIR\*.tmp"
  Delete "$INSTDIR\*.lock"
  
  ; Force remove any stubborn files that might be blocking upgrade
  ${If} ${FileExists} "$INSTDIR\Lecture Logger.exe"
    DetailPrint "Removing existing executable..."
    Delete /REBOOTOK "$INSTDIR\Lecture Logger.exe"
  ${EndIf}
  
  ${If} ${FileExists} "$INSTDIR\resources\app.asar"
    DetailPrint "Removing existing app resources..."
    Delete /REBOOTOK "$INSTDIR\resources\app.asar"
  ${EndIf}
!macroend

; Custom section to handle upgrade-specific logic
!macro customRemoveFiles
  ; Clean up old installation files that might cause conflicts
  DetailPrint "Cleaning up previous installation..."
  
  ; Remove main executable with reboot if necessary
  Delete /REBOOTOK "$INSTDIR\Lecture Logger.exe"
  
  ; Remove all DLLs and resources
  Delete /REBOOTOK "$INSTDIR\*.dll"
  Delete /REBOOTOK "$INSTDIR\*.pak"
  Delete /REBOOTOK "$INSTDIR\*.bin"
  Delete /REBOOTOK "$INSTDIR\*.dat"
  
  ; Remove resources directory
  RMDir /r /REBOOTOK "$INSTDIR\resources"
  
  ; Remove locales directory
  RMDir /r /REBOOTOK "$INSTDIR\locales"
  
  ; Remove python-runtime directory
  RMDir /r /REBOOTOK "$INSTDIR\python-runtime"
!macroend