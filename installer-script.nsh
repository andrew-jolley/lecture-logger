; Custom NSIS script for Lecture Logger - Silent cleanup when app is detected

<<<<<<< HEAD
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
=======
; This macro runs when NSIS detects a running app - instead of showing dialog, we clean up silently
!macro customCheckAppRunning
  DetailPrint "Automatically resolving running application conflicts..."
>>>>>>> 8813884328ed60acc76e21a4f157fd6551a4c4cd
  
  ; Kill any running Lecture Logger processes
  nsExec::Exec 'taskkill /F /IM "Lecture Logger.exe" /T'
  nsExec::Exec 'taskkill /F /IM "LectureLogger.exe" /T'
  nsExec::Exec 'taskkill /F /IM "LectureLogger-*.exe" /T'
  
  ; Brief wait for process termination
  Sleep 1000
  
  ; Remove existing installation directory to ensure clean install
  RMDir /r "$LOCALAPPDATA\Programs\Lecture Logger"
  
  DetailPrint "Application conflicts resolved - continuing installation"
!macroend

!macro preInit
  DetailPrint "Lecture Logger installer starting..."
!macroend

!macro customInit
<<<<<<< HEAD
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
=======
  DetailPrint "Initializing installation..."
>>>>>>> 8813884328ed60acc76e21a4f157fd6551a4c4cd
!macroend

!macro customInstallMode
  SetShellVarContext current
  DetailPrint "Installing for current user"
!macroend

<<<<<<< HEAD
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
=======
!macro customInstall
  DetailPrint "Installation completed successfully"
!macroend

!macro customUnInit
  DetailPrint "Preparing to uninstall Lecture Logger..."
>>>>>>> 8813884328ed60acc76e21a4f157fd6551a4c4cd
!macroend