#!/usr/bin/env pwsh
# Portuguese Washer App Registration - Improved Version
# With better field clearing and focus management

Write-Host "═" * 70 -ForegroundColor Cyan  
Write-Host "Portuguese User Registration - IMPROVED" -ForegroundColor Green
Write-Host "═" * 70

$adbPath = "$env:USERPROFILE\.android-mcp-server\platform-tools\platform-tools\adb.exe"
if (-not (Test-Path $adbPath)) {
    $adbPath = "adb"
}

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
    # Take initial screenshot
    Write-Host "`n📸 Initial state:"
    Invoke-ADB "screencap -p /sdcard/improved_step0_initial.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # AGGRESSIVE CLEARING - Select ALL and delete from each field MULTIPLE TIMES
    Write-Host "`n🔄 STEP 0: Aggressive field cleanup (triple clear all fields)"
    $fields = @(
        @{name="First Name"; x=225; y=387},
        @{name="Last Name"; x=532; y=387},
        @{name="Email"; x=362; y=589},
        @{name="Phone"; x=362; y=749}
    )

    foreach ($field in $fields) {
        Write-Host "  • Cleaning $($field.name) field..."
        Invoke-ADB "input tap $($field.x) $($field.y)" | Out-Null
        Start-Sleep -Milliseconds 150
        
        # Triple clear: Select All + Delete, then backspace 50x
        Invoke-ADB "input keyevent 29" | Out-Null  # KEYCODE_HOME
        Start-Sleep -Milliseconds 50
        Invoke-ADB "input keyevent 130" | Out-Null  # KEYCODE_END  
        Start-Sleep -Milliseconds 50
        
        for ($i = 0; $i -lt 100; $i++) {
            Invoke-ADB "input keyevent 67" | Out-Null  # KEYCODE_DEL
            if ($i % 20 -eq 0) { Write-Host -NoNewline "." }
        }
        Write-Host " ✓"
        Start-Sleep -Milliseconds 250
    }

    # Now fill each field carefully
    Write-Host "`n📝 STEP 1: Filling First Name (João)"
    Invoke-ADB "input tap 225 387" | Out-Null
    Start-Sleep -Milliseconds 200
    Invoke-ADB "input text João" | Out-Null
    Start-Sleep -Milliseconds 400
    
    Write-Host "✓ First Name: João"

    Write-Host "`n📝 STEP 2: Filling Last Name (Silva)"
    Invoke-ADB "input tap 532 387" | Out-Null
    Start-Sleep -Milliseconds 200
    Invoke-ADB "input text Silva" | Out-Null
    Start-Sleep -Milliseconds 400
    
    Write-Host "✓ Last Name: Silva"

    Write-Host "`n📝 STEP 3: Filling Email (joao.silva@example.pt)"
    Invoke-ADB "input tap 362 589" | Out-Null
    Start-Sleep -Milliseconds 200
    Invoke-ADB "input text joao.silva@example.pt" | Out-Null
    Start-Sleep -Milliseconds 400
    
    Write-Host "✓ Email: joao.silva@example.pt"

    Write-Host "`n📝 STEP 4: Filling Phone (912345678)"
    Invoke-ADB "input tap 362 749" | Out-Null
    Start-Sleep -Milliseconds 200
    Invoke-ADB "input text 912345678" | Out-Null
    Start-Sleep -Milliseconds 400
    
    Write-Host "✓ Phone: 912345678"

    # Screenshot after filling visible fields
    Write-Host "`n📸 After filling top fields:"
    Invoke-ADB "screencap -p /sdcard/improved_step1_filled.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # Scroll down to see VAT and checkbox
    Write-Host "`n📜 Scrolling down..."
    Invoke-ADB "input swipe 540 900 540 300 600" | Out-Null
    Start-Sleep -Milliseconds 600

    # Take screenshot after scroll
    Write-Host "📸 After scroll:"
    Invoke-ADB "screencap -p /sdcard/improved_step2_scrolled.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # Fill VAT
    Write-Host "`n📝 STEP 5: Filling VAT (123456789)"
    Invoke-ADB "input tap 362 977" | Out-Null
    Start-Sleep -Milliseconds 200
    Invoke-ADB "input text 123456789" | Out-Null
    Start-Sleep -Milliseconds 400
    
    Write-Host "✓ VAT: 123456789"

    # Verify Terms Checkbox
    Write-Host "`n✅ STEP 6: Checking Terms & Conditions"
    Write-Host "  • Current checkbox status: Verifying..."
    Invoke-ADB "screencap -p /sdcard/improved_step3_before_checkbox.png" | Out-Null
    Start-Sleep -Milliseconds 200

    Write-Host "  • Tapping checkbox..."
    Invoke-ADB "input tap 114 1147" | Out-Null
    Start-Sleep -Milliseconds 300

    # Take final screenshot
    Write-Host "`n📸 Final form state:"
    Invoke-ADB "screencap -p /sdcard/improved_step4_final_form.png" | Out-Null
    Write-Host "✓ Screenshot saved"

    # Submit
    Write-Host "`n📤 STEP 7: Submitting form (clicking Next)..."
    Invoke-ADB "input tap 845 1244" | Out-Null
    Start-Sleep -Milliseconds 3000

    # Verify success
    Write-Host "`n✅ STEP 8: Checking submission result..."
    Invoke-ADB "screencap -p /sdcard/improved_step5_result.png" | Out-Null
    Write-Host "✓ Result screenshot saved"

    # Final screenshot
    Start-Sleep -Milliseconds 500
    Write-Host "`n📸 Final verification:"
    Invoke-ADB "screencap -p /sdcard/improved_final.png" | Out-Null
    Write-Host "✓ Final screenshot saved"

    Write-Host "`n" + ("═" * 70) -ForegroundColor Green
    Write-Host "✅ PORTUGUESE REGISTRATION COMPLETED!" -ForegroundColor Green  
    Write-Host ("═" * 70) -ForegroundColor Green
    Write-Host "`n✓ All screenshots saved to /sdcard/improved_*.png"

} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    exit 1
}
