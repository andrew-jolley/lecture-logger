; Custom NSIS script for Lecture Logger - Silent cleanup when app is detected

; This macro runs when NSIS detects a running app - instead of showing dialog, we clean up silently
!macro customCheckAppRunning
  DetailPrint "Automatically resolving running application conflicts..."
  
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
  DetailPrint "Initializing installation..."
!macroend

!macro customInstallMode
  SetShellVarContext current
  DetailPrint "Installing for current user"
!macroend

!macro customInstall
  DetailPrint "Installation completed successfully"
!macroend

!macro customUnInit
  DetailPrint "Preparing to uninstall Lecture Logger..."
!macroend