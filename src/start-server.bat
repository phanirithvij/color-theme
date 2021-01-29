@echo on

IF NOT EXIST "winenv" (
    py -m venv winenv
    @REM https://stackoverflow.com/a/12826137/8608146
    call winenv\Scripts\activate.bat
    pip install -r ..\requirements.freeze.txt
) ELSE (
    call winenv\Scripts\activate.bat
)

@echo on

cd server\scripts
@echo off
SET CURRENTDIR="%cd%"
@echo on
@echo "PWD" %CURRENTDIR%
IF NOT EXIST "scripts.exe" (
    go get -v github.com/RobCherry/vibrant
    go build -x
)

@echo off
SET CURRENTDIR="%cd%"
@echo on
@echo "PWD" %CURRENTDIR%
cd ..\..\
@echo off
SET CURRENTDIR="%cd%"
@echo on
@echo "PWD" %CURRENTDIR%
python -m server

@echo Don't forget to run deactivate.bat
