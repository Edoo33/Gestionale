@echo off
cd /d "C:\Users\edoar\Desktop\project"

if not exist node_modules (
    echo Installo i componenti, attendi...
    call npm install
)

echo Avvio il sito...
call npm run dev -- --open
pause