@echo off
setlocal EnableDelayedExpansion

:: ==========================================
:: إعدادات المستخدم (قم بتعديل البريد الإلكتروني فقط)
:: ==========================================
set "REPO_URL=https://github.com/Hashed-Albaham/MultiAiAgentic.git"
set "REPO_NAME=MultiAiAgentic"
set "MY_NAME=Hashed Albaham"
set "MY_EMAIL=Hashedhassanzaeed222@gmail.com"
:: ==========================================

echo [INFO] Starting Process for %REPO_NAME%...

:: 1. ضبط التوقيت بشكل دقيق (يعمل على كل الانظمة)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%"

:: 2. التأكد من وجود Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    pause
    exit /b
)

:: 3. إنشاء المستودع المحلي إذا لم يكن موجوداً
if not exist ".git" (
    echo [INIT] Initializing new Git repository...
    git init
)

:: 4. === هام جداً: ضبط هويتك لهذا المشروع فقط ===
:: هذا يمنع ظهور اسم صاحب الجهاز (Anass) ويظهر اسمك أنت
echo [CONFIG] Setting user identity to %MY_NAME%...
git config user.name "%MY_NAME%"
git config user.email "%MY_EMAIL%"

:: 5. ربط المستودع برابط GitHub
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo [REMOTE] Adding remote origin...
    git remote add origin %REPO_URL%
) else (
    echo [REMOTE] Origin already exists, ensuring URL is correct...
    git remote set-url origin %REPO_URL%
)

:: 6. إضافة الملفات (مع تجاهل الملفات الحساسة)
echo [ADD] Adding files...
git rm --cached .env >nul 2>nul
git add .

:: 7. عمل الكوميت (Commit) بالتنسيق المطلوب
set "COMMIT_MSG=[%REPO_NAME%] Update: %TIMESTAMP%"
echo [COMMIT] Message: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

:: 8. الرفع إلى GitHub
echo.
echo [PUSH] Uploading to GitHub...
echo ---------------------------------------------------
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Push failed! 
    echo Possible reasons:
    echo 1. The repository "%REPO_NAME%" does not exist on GitHub.com yet.
    echo    (Please go to GitHub and create an empty repo named MultiAiAgentic first).
    echo 2. Internet connection issue.
    echo 3. Permissions issue (Login required).
) else (
    echo.
    echo [SUCCESS] Done! Your code is live on GitHub as %MY_NAME%.
)

echo.
pause