; Custom NSIS script for Lecture Logger - Force user-only installation

; Override the default script to remove installation mode selection
!define MULTIUSER_EXECUTIONLEVEL Standard

; Completely override the installation mode function
!macro MULTIUSER_INSTALLMODE_FUNCTION
  ; Always use current user mode
  StrCpy $MultiUser.InstallMode "CurrentUser"
  SetShellVarContext current
!macroend

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

; Add custom sections for user to choose shortcuts
!macro customInstallerAssociation
  ; Desktop shortcut section (optional)
  Section "Desktop Shortcut" SecDesktop
    SetShellVarContext current
    CreateShortcut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
    DetailPrint "Desktop shortcut created"
  SectionEnd

  ; Start Menu shortcut section (optional)  
  Section "Start Menu Shortcut" SecStartMenu
    SetShellVarContext current
    CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
    CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
    CreateShortcut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall ${PRODUCT_NAME}.lnk" "$INSTDIR\Uninstall ${PRODUCT_NAME}.exe"
    DetailPrint "Start Menu shortcuts created"
  SectionEnd

  ; Set both sections as selected by default (users can uncheck them)
  !insertmacro SelectSection ${SecDesktop}
  !insertmacro SelectSection ${SecStartMenu}
  
  ; Add descriptions for the sections
  !insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} "Create a shortcut on the desktop"
    !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} "Create shortcuts in the Start Menu"
  !insertmacro MUI_FUNCTION_DESCRIPTION_END
!macroend

!macro customUnInit
  DetailPrint "Preparing to uninstall Lecture Logger..."
  
  ; Clean up shortcuts during uninstall
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall ${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
!macroend