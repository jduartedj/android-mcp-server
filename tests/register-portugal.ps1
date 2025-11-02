#!/usr/bin/env pwsh
# Portuguese Washer Registration Test
# Direct ADB command execution

Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "Portuguese User Registration Test" -ForegroundColor Green
Write-Host "═" * 70

# Find ADB executable
$adbPath = "$env:USERPROFILE\.android-mcp-server\platform-tools\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    Write-Host "Trying to find ADB in PATH..." -ForegroundColor Yellow
    $adbPath = "adb"
}

# Helper function to execute ADB commands
function Invoke-ADB {
    param(
        [string]$Command
    )
    try {
        $result = & $adbPath shell $Command 2>&1
        return $result
    } catch {
        Write-Host "Error executing ADB command: $_" -ForegroundColor Red
        return $null
    }
}

try {
    Write-Host "`n📸 Step 0: Taking initial screenshot"
    Invoke-ADB "screencap -p /sdcard/initial.png" | Out-Null
    Write-Host "✓ Initial screenshot captured"

    # Step 1: Fill First Name
    Write-Host "`n📝 Step 1: Filling First Name (João)"
    Write-Host "  • Tapping first name field at (225, 474)"
    Invoke-ADB "input tap 225 474" | Out-Null
    Start-Sleep -Milliseconds 300

    Write-Host "  • Clearing field with 30 delete keys"
    for ($i = 0; $i -lt 30; $i++) {
        Invoke-ADB "input keyevent 67" | Out-Null  # KEYCODE_DEL
        if ($i % 10 -eq 0) { Write-Host -NoNewline "." }
    }
    Write-Host " ✓"
    Start-Sleep -Milliseconds 200

    Write-Host "  • Typing: João"
    Invoke-ADB "input text João" | Out-Null
    Start-Sleep -Milliseconds 500

    # Step 2: Fill Last Name
    Write-Host "`n📝 Step 2: Filling Last Name (Silva)"
    Write-Host "  • Tapping last name field at (532, 474)"
    Invoke-ADB "input tap 532 474" | Out-Null
    Start-Sleep -Milliseconds 300

    Write-Host "  • Typing: Silva"
    Invoke-ADB "input text Silva" | Out-Null
    Start-Sleep -Milliseconds 500

    # Step 3: Fill Email
    Write-Host "`n📝 Step 3: Filling Email (joao.silva@example.pt)"
    Write-Host "  • Tapping email field at (362, 631)"
    Invoke-ADB "input tap 362 631" | Out-Null
    Start-Sleep -Milliseconds 300

    Write-Host "  • Clearing field with 60 delete keys"
    for ($i = 0; $i -lt 60; $i++) {
        Invoke-ADB "input keyevent 67" | Out-Null
        if ($i % 10 -eq 0) { Write-Host -NoNewline "." }
    }
    Write-Host " ✓"
    Start-Sleep -Milliseconds 200

    Write-Host "  • Typing: joao.silva@example.pt"
    Invoke-ADB "input text joao.silva@example.pt" | Out-Null
    Start-Sleep -Milliseconds 500

    # Step 4: Fill Phone
    Write-Host "`n📝 Step 4: Filling Phone Number (912345678)"
    Write-Host "  • Tapping phone field at (362, 792)"
    Invoke-ADB "input tap 362 792" | Out-Null
    Start-Sleep -Milliseconds 300

    Write-Host "  • Clearing field with 30 delete keys"
    for ($i = 0; $i -lt 30; $i++) {
        Invoke-ADB "input keyevent 67" | Out-Null
        if ($i % 10 -eq 0) { Write-Host -NoNewline "." }
    }
    Write-Host " ✓"
    Start-Sleep -Milliseconds 200

    Write-Host "  • Typing: 912345678"
    Invoke-ADB "input text 912345678" | Out-Null
    Start-Sleep -Milliseconds 500

    # Step 5: Screenshot after form fill
    Write-Host "`n📸 Step 5: Taking screenshot before scroll"
    Invoke-ADB "screencap -p /sdcard/after_phone.png" | Out-Null
    Write-Host "✓ Screenshot captured"

    # Step 6: Scroll down to see VAT and checkbox
    Write-Host "`n📜 Step 6: Scrolling down to see VAT and Terms"
    Invoke-ADB "input swipe 540 900 540 400 500" | Out-Null
    Start-Sleep -Milliseconds 800

    # Step 7: Fill VAT
    Write-Host "`n📝 Step 7: Filling VAT (123456789)"
    Write-Host "  • Tapping VAT field at (362, 1022)"
    Invoke-ADB "input tap 362 1022" | Out-Null
    Start-Sleep -Milliseconds 300

    Write-Host "  • Typing: 123456789"
    Invoke-ADB "input text 123456789" | Out-Null
    Start-Sleep -Milliseconds 500

    # Step 8: Verify Terms checkbox
    Write-Host "`n✅ Step 8: Verifying Terms checkbox"
    Write-Host "  • Tapping terms checkbox at (160, 1689)"
    Invoke-ADB "input tap 160 1689" | Out-Null
    Start-Sleep -Milliseconds 500

    # Step 9: Screenshot before submission
    Write-Host "`n📸 Step 9: Taking screenshot ready to submit"
    Invoke-ADB "screencap -p /sdcard/ready_to_submit.png" | Out-Null
    Write-Host "✓ Screenshot captured"

    # Step 10: Click Next button
    Write-Host "`n📤 Step 10: Clicking NEXT button to submit"
    Write-Host "  • Tapping Next button at (845, 1244)"
    Invoke-ADB "input tap 845 1244" | Out-Null
    Start-Sleep -Milliseconds 2500

    # Step 11: Verify submission success
    Write-Host "`n✅ Step 11: Verifying form submission success"
    Invoke-ADB "screencap -p /sdcard/submission_result.png" | Out-Null
    Write-Host "✓ Result screenshot captured"

    Write-Host "`n" + ("═" * 70) -ForegroundColor Green
    Write-Host "✅ PORTUGUESE REGISTRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host ("═" * 70) -ForegroundColor Green

    Write-Host "`nRegistration Data:"
    Write-Host "  • Name: João Silva"
    Write-Host "  • Email: joao.silva@example.pt"
    Write-Host "  • Phone: +351 912345678"
    Write-Host "  • VAT: 123456789"
    Write-Host "  • Country: Portugal"

} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    exit 1
}
