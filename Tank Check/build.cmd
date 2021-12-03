SET CORDOVA_PLATFORMS=android
SET CORDOVA_CMDLINE="%1 %2 %3"
node hooks/before_prepare/before_prepare.js dummy %cd%


rmdir /S /Q platforms
rmdir /S /Q plugins

REM cordova platform add android@9.0.0 %1 %2 %3 && cordova build android %1 %2 %3 
cordova platform add android@9.0.0 %1 %2 %3 && cordova build android %1 %2 %3 




