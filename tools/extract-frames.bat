@echo off
chcp 65001 >nul
REM ==========================================================================
REM  extract-frames.bat : 히어로 영상을 스크롤용 프레임 이미지로 바꿉니다.
REM
REM  준비 (처음 한 번만)
REM    1) ffmpeg 설치: 시작 메뉴에서 "명령 프롬프트"를 열고
REM         winget install Gyan.FFmpeg
REM       를 입력한 뒤, 창을 닫았다가 다시 엽니다.
REM
REM  사용법
REM    1) 히어로 영상 파일 이름을 hero.mp4 로 바꿔 이 파일(tools 폴더)에 넣습니다.
REM    2) 이 파일을 더블클릭합니다.
REM    3) 끝나면 화면에 나온 장수를 site\content.js 의 hero.sequence 의 count 에 적습니다.
REM ==========================================================================

cd /d "%~dp0"
set IN=hero.mp4
set OUT=..\site\assets\hero
set FPS=24

if not exist "%IN%" (
  echo [안내] tools 폴더에 hero.mp4 가 없습니다. 영상을 넣고 다시 실행하세요.
  pause
  exit /b 1
)

where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo [안내] ffmpeg 가 설치되어 있지 않습니다. 위 설명대로 설치한 뒤 다시 실행하세요.
  pause
  exit /b 1
)

if not exist "%OUT%\desktop" mkdir "%OUT%\desktop"
if not exist "%OUT%\mobile" mkdir "%OUT%\mobile"
del /q "%OUT%\desktop\*.webp" 2>nul
del /q "%OUT%\mobile\*.webp" 2>nul

echo [1/3] 데스크톱용 프레임 (가로 1600px) 만드는 중...
ffmpeg -loglevel error -i "%IN%" -vf "fps=%FPS%,scale=1600:-2" -c:v libwebp -quality 72 "%OUT%\desktop\%%04d.webp"

echo [2/3] 휴대폰용 프레임 (세로 화면, 가운데 자르기) 만드는 중...
ffmpeg -loglevel error -i "%IN%" -vf "fps=%FPS%,crop=ih*9/16:ih,scale=720:-2" -c:v libwebp -quality 70 "%OUT%\mobile\%%04d.webp"

echo [3/3] 대표 이미지(poster) 만드는 중...
ffmpeg -loglevel error -y -i "%IN%" -frames:v 1 -vf "scale=1600:-2" -c:v libwebp -quality 80 "%OUT%\poster.webp"

for /f %%A in ('dir /b "%OUT%\desktop\*.webp" ^| find /c /v ""') do set COUNT_D=%%A
for /f %%A in ('dir /b "%OUT%\mobile\*.webp" ^| find /c /v ""') do set COUNT_M=%%A

echo.
echo 완료!
echo   desktop 프레임 수: %COUNT_D%   ^(content.js 의 desktop count 에 적기^)
echo   mobile  프레임 수: %COUNT_M%   ^(content.js 의 mobile count 에 적기^)
echo   poster: assets/hero/poster.webp   ^(content.js 의 poster 에 적기^)
echo.
echo 팁: 프레임이 200장을 넘으면 용량이 커집니다. 위의 FPS 값을 18 정도로 낮춰 보세요.
pause
