; Custom NSIS script for Lecture Logger
; This script handles proper app closure detection and killing processes

!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "nsDialogs.nsh"

; Variables
Var IsUpgrade

; Function to detect if this is an upgrade
Function DetectUpgrade
  ; Check registry for existing installation
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\{a8b7bd78-cfea-5f1f-95a5-6a1b0730475d}" "InstallLocation"
  ${If} $0 != ""
    StrCpy $IsUpgrade "true"
    DetailPrint "Upgrade detected - existing installation at: $0"
  ${Else}
    StrCpy $IsUpgrade "false"
    DetailPrint "Fresh installation detected"
  ${EndIf}
FunctionEnd

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
  DetailPrint "Initializing Lecture Logger installer..."
  
  ; Detect if this is an upgrade
  Call DetectUpgrade
  
  ; Always kill processes at the start
  Call KillLectureLoggerProcesses
  
  ${If} $IsUpgrade == "true"
    DetailPrint "UPGRADE MODE: Previous installation will be completely removed and replaced."
    ; Perform complete removal BEFORE installation begins
    Call CompletelyRemoveExistingInstallation
  ${Else}
    DetailPrint "FRESH INSTALLATION: Installing Lecture Logger for the first time."
    ; Just kill any stray processes for fresh install
    Call KillLectureLoggerProcesses
  ${EndIf}
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

; Function to completely remove existing installation
Function CompletelyRemoveExistingInstallation
  DetailPrint "Performing complete removal of existing installation..."
  
  ; Kill all processes first
  Call KillLectureLoggerProcesses
  
  ; Wait extra time for file handles to be released
  Sleep 3000
  
  ; Remove read-only attributes from all files in the directory
  ${If} ${FileExists} "$INSTDIR"
    DetailPrint "Removing read-only attributes..."
    nsExec::ExecToStack 'attrib -R "$INSTDIR\*.*" /S /D'
    Pop $0
    Pop $1
  ${EndIf}
  
  ; Use multiple removal attempts with different methods
  ${If} ${FileExists} "$INSTDIR"
    DetailPrint "Attempting removal method 1: Standard RMDir..."
    RMDir /r "$INSTDIR"
  ${EndIf}
  
  ${If} ${FileExists} "$INSTDIR"
    DetailPrint "Attempting removal method 2: CMD RD command..."
    nsExec::ExecToStack 'cmd /c "rd /s /q "$INSTDIR""'
    Pop $0
    Pop $1
  ${EndIf}
  
  ${If} ${FileExists} "$INSTDIR"
    DetailPrint "Attempting removal method 3: PowerShell Remove-Item..."
    nsExec::ExecToStack 'powershell -Command "Remove-Item \"$INSTDIR\" -Recurse -Force -ErrorAction SilentlyContinue"'
    Pop $0
    Pop $1
  ${EndIf}
  
  ${If} ${FileExists} "$INSTDIR"
    DetailPrint "Final attempt: Schedule for removal on reboot..."
    RMDir /r /REBOOTOK "$INSTDIR"
    DetailPrint "WARNING: Some files will be removed on next system restart."
  ${EndIf}
  
  ; Always recreate the installation directory
  CreateDirectory "$INSTDIR"
  
  DetailPrint "Complete removal process finished. Directory prepared for fresh installation."
FunctionEnd

; Custom installer completion (runs after files are installed)
!macro customInstall
  ; Nothing to do here - all cleanup was done before installation
  DetailPrint "Installation files copied successfully."
!macroend