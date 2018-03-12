@echo off
cls
if "%~1"=="" GOTO :syntax

set YR=%DATE:~10,4%
set MO=%DATE:~4,2%
set DA=%DATE:~7,2%

set HR=%TIME: =0%
set HR=%HR:~0,2%
set MI=%TIME:~3,2%
set SC=%TIME:~6,2%

set Filename=trp-team-tools-%YR%%MO%%DA%%HR%%MI%%SC%.zip

echo.
echo.
echo.
echo Prepare "%Filename%" for upload to AWS Elastic Beanstalk.
echo.
echo This batch file uses WinZip command line tools installed to the default location.
echo.
echo.
pause

if %~1==prod GOTO :prod
if %~1==qual GOTO :qual
GOTO :syntax

:prod
copy resources\https-instanceprod.config .ebextensions\https-instance.config
copy resources\private-keyprod.pem server\config\private-key.pem
copy resources\TRP_AEMPERFORMANCETOOLKIT_IDP_T._Rowe_Price_metadataprod.xml server\config\TRP_AEMPERFORMANCETOOLKIT_IDP_T._Rowe_Price_metadata.xml
copy resources\TRP_AEMPERFORMANCETOOLKIT_SP_T._Rowe_Price_metadataprod.xml server\config\TRP_AEMPERFORMANCETOOLKIT_SP_T._Rowe_Price_metadata.xml
GOTO :buildit

:qual
copy resources\https-instancequal.config .ebextensions\https-instance.config
copy resources\private-keyqual.pem server\config\private-key.pem
copy resources\TRP_AEMPERFORMANCETOOLKIT_IDP_T._Rowe_Price_metadataqual.xml server\config\TRP_AEMPERFORMANCETOOLKIT_IDP_T._Rowe_Price_metadata.xml
copy resources\TRP_AEMPERFORMANCETOOLKIT_SP_T._Rowe_Price_metadataqual.xml server\config\TRP_AEMPERFORMANCETOOLKIT_SP_T._Rowe_Price_metadata.xml

REM FALLTHROUGH INTENTIONAL

:buildit
move *.zip \\nasrel01\public\projects\t-rowe-price\

"C:\Program Files\WinZip\wzzip.exe" -r -P %Filename% .ebextensions\*.*
timeout 2
"C:\Program Files\WinZip\wzzip.exe" -r -P %Filename% public\*.*
timeout 2
"C:\Program Files\WinZip\wzzip.exe" -r -P %Filename% server\*.*
timeout 2
"C:\Program Files\WinZip\wzzip.exe" -r -P %Filename% src\*.*
timeout 2
"C:\Program Files\WinZip\wzzip.exe" -P %Filename% express.js
timeout 2
"C:\Program Files\WinZip\wzzip.exe" -P %Filename% package.json
timeout 2
goto :end

:syntax
echo.
echo.
echo.
echo Error invoking build. Usage is Build qual or Build prod
echo.
echo.
echo.

:end