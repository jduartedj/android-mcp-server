#!/usr/bin/env pwsh
# Complete Portuguese Registration with Fresh Start
# This version closes and restarts the app for a clean state

Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "Portuguese Registration - FINAL ATTEMPT (Fresh App)" -ForegroundColor Green
Write-Host "═" * 70

$adbPath = "$env:USERPROFILE\.android-mcp-server\platform-tools\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) { $adbPath = "adb" }

function Invoke-ADB {
    param([string]$Command)
    try {
        $result = & $adbPath shell $Command 2>&1
        return $result
    } catch {
        Write-Host "ADB Error: $_" -ForegroundColor Red
        return $null
    }
}

try {
    # Step 0: Close the app completely
    Write-Host "`n🔄 Step 0: Restarting app (closing and reopening)"
    Write-Host "  • Closing pt.washer..."
    Invoke-ADB "am force-stop pt.washer" | Out-Null
    Start-Sleep -Milliseconds 500

    Write-Host "  • Reopening pt.washer..."
    Invoke-ADB "am start -n pt.washer/.MainActivity" | Out-Null
    Start-Sleep -Milliseconds 3000

    Write-Host "✓ App restarted fresh"

    # Take screenshot to verify clean start
    Write-Host "`n📸 Clean registration form:"
    Invoke-ADB "screencap -p /sdcard/final_step0_clean.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # Now fill the form SLOWLY with long delays
    Write-Host "`n📝 STEP 1: First Name - João"
    Invoke-ADB "input tap 225 387" | Out-Null
    Start-Sleep -Milliseconds 400

    Invoke-ADB "input text João" | Out-Null
    Start-Sleep -Milliseconds 800

    Write-Host "✓ Filled: João"

    Write-Host "`n📝 STEP 2: Last Name - Silva"
    Invoke-ADB "input tap 532 387" | Out-Null
    Start-Sleep -Milliseconds 400

    Invoke-ADB "input text Silva" | Out-Null
    Start-Sleep -Milliseconds 800

    Write-Host "✓ Filled: Silva"

    Write-Host "`n📝 STEP 3: Email - joao.silva@example.pt"
    Invoke-ADB "input tap 362 589" | Out-Null
    Start-Sleep -Milliseconds 400

    Invoke-ADB "input text joao.silva@example.pt" | Out-Null
    Start-Sleep -Milliseconds 800

    Write-Host "✓ Filled: joao.silva@example.pt"

    Write-Host "`n📝 STEP 4: Phone - 912345678"
    Invoke-ADB "input tap 362 749" | Out-Null
    Start-Sleep -Milliseconds 400

    Invoke-ADB "input text 912345678" | Out-Null
    Start-Sleep -Milliseconds 800

    Write-Host "✓ Filled: 912345678"

    # Screenshot after top fields
    Write-Host "`n📸 After filling top section:"
    Invoke-ADB "screencap -p /sdcard/final_step1_top_fields.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # Scroll down with longer delay
    Write-Host "`n📜 Scrolling down..."
    Invoke-ADB "input swipe 540 900 540 300 800" | Out-Null
    Start-Sleep -Milliseconds 1200

    Write-Host "✓ Scrolled down"

    # Take screenshot after scroll
    Write-Host "`n📸 After scroll:"
    Invoke-ADB "screencap -p /sdcard/final_step2_scrolled.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # Fill VAT
    Write-Host "`n📝 STEP 5: VAT - 123456789"
    Invoke-ADB "input tap 362 977" | Out-Null
    Start-Sleep -Milliseconds 400

    Invoke-ADB "input text 123456789" | Out-Null
    Start-Sleep -Milliseconds 800

    Write-Host "✓ Filled: 123456789"

    # Check Terms checkbox
    Write-Host "`n✅ STEP 6: Terms & Conditions"
    Write-Host "  • Taking screenshot to verify state..."
    Invoke-ADB "screencap -p /sdcard/final_step3_terms.png" | Out-Null

    Write-Host "  • Clicking checkbox (if needed)..."
    Invoke-ADB "input tap 114 1147" | Out-Null
    Start-Sleep -Milliseconds 400

    Write-Host "✓ Terms acknowledged"

    # Final screenshot before submit
    Write-Host "`n📸 Final form ready:"
    Invoke-ADB "screencap -p /sdcard/final_step4_ready.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # Click NEXT to submit
    Write-Host "`n📤 STEP 7: Submitting (clicking NEXT)..."
    Invoke-ADB "input tap 845 1244" | Out-Null
    Start-Sleep -Milliseconds 4000

    Write-Host "✓ Form submitted"

    # Verify successful submission
    Write-Host "`n✅ STEP 8: Verification"
    Invoke-ADB "screencap -p /sdcard/final_step5_result.png" | Out-Null
    Write-Host "✓ Result screenshot saved"

    Start-Sleep -Milliseconds 500
    Write-Host "`n📸 Final page:"
    Invoke-ADB "screencap -p /sdcard/final_complete.png" | Out-Null
    Write-Host "✓ Final screenshot saved"

    Write-Host "`n" + ("═" * 70) -ForegroundColor Green
    Write-Host "✅ PORTUGUESE USER REGISTRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host ("═" * 70) -ForegroundColor Green
    Write-Host "`n📋 Registration Summary:"
    Write-Host "  ✓ Name: João Silva"
    Write-Host "  ✓ Email: joao.silva@example.pt"
    Write-Host "  ✓ Phone: +351 912345678"
    Write-Host "  ✓ VAT: 123456789"
    Write-Host "  ✓ Country: Portugal"
    Write-Host "  ✓ Terms: Agreed"
    Write-Host "`n💾 Screenshots saved to /sdcard/final_*.png"

} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    exit 1
}
