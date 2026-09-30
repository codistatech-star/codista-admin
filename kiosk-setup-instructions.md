# Kiosk setup instructions

Auto-start the Codista RFID attendance kiosk on a dedicated door PC. With a USB HID reader, the browser page must stay focused — this guide locks the PC into `/kiosk` at boot.

## Prerequisites

### Hardware / network

- Dedicated PC (or tablet) at the door, always powered
- RFID USB HID reader plugged into that PC
- Stable internet to the admin host (e.g. `https://admin.codista.in`)
- Display that stays on

### Codista admin

- Batches have **start** and **end** times (IST) under **Settings → Batches** (required for kiosk matching)
- Kiosk device created under **Settings → Kiosk devices**
- Device **4-digit PIN** copied
- Members enrolled with RFID card UIDs and mapped to batches
- `/kiosk` tested once manually (tap shows Present during the batch window)

### Windows

- Windows 10/11 (Pro preferred if using Assigned Access)
- Chrome or Edge installed
- Not required: Windows RFID agent / service, VID/PID setup

---

## A. Prepare Codista (any PC)

1. Sign in to admin → **Settings → Batches** → set start/end times (IST) on each batch.
2. **Settings → Kiosk devices** → **Add device** (name + branch) → **Copy** the 4-digit PIN.
3. Enroll member RFID cards (member create/edit → RFID field → tap card → Save) and map batches.
4. Open `/kiosk`, enter the PIN, tap once during a class window → confirm **Present**.
5. Note the URL you will use, e.g. `https://admin.codista.in/kiosk`  
   (local testing: `http://localhost:3000/kiosk`).

---

## B. Create a kiosk Windows user

1. Settings → **Accounts** → **Other users** → **Add account**.
2. Create a local account, e.g. `codista-kiosk`, with a password.
3. Sign out, then sign in as `codista-kiosk`.
4. Install **Chrome** or **Edge** if missing.

Use this account only for the door kiosk — not your daily admin login.

---

## C. Auto sign-in and never sleep

1. Press `Win + R`, type `netplwiz`, press Enter.
2. Uncheck **Users must enter a user name and password to use this computer**.
3. Apply → enter the `codista-kiosk` password twice.
4. Settings → **System** → **Power**:
   - Screen: **Never**
   - Sleep: **Never** (when plugged in)

---

## D. Pair the device PIN (same Windows user)

1. Stay signed in as `codista-kiosk`.
2. Open Chrome (or Edge) → go to `https://admin.codista.in/kiosk`.
3. Enter the 4-digit device PIN → start scanning.
4. Tap a card once during the class window → confirm Present / Already marked.
5. Close the browser normally.

The PIN is stored in this user’s browser data (`localStorage`).  
Do **not** clear browsing data for this profile later, or you will need to pair again.

---

## E. Start the browser in kiosk mode at logon

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Right-click empty area → **New → Shortcut**.
3. Set the target (adjust the browser path if needed).

**Chrome:**

```text
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --disable-session-crashed-bubble --check-for-update-interval=604800 "https://admin.codista.in/kiosk"
```

**Edge:**

```text
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --edge-kiosk-type=fullscreen "https://admin.codista.in/kiosk"
```

4. Name the shortcut `Codista Kiosk` → Finish.
5. Double-click once to test: fullscreen page, card tap works.

---

## F. Reboot test

1. Restart the PC.
2. It should auto-login as `codista-kiosk`.
3. Chrome/Edge should open fullscreen on `/kiosk`.
4. Tap an enrolled card during a batch window → Present or Already marked.

If the pair screen appears, repeat step **D**, then reboot again.

---

## G. Optional: stronger lock (Windows Pro)

Settings → **Accounts** → **Other users** → **Set up a kiosk** (Assigned Access):

- Account: `codista-kiosk`
- App: Microsoft Edge (or Chrome if offered)
- URL: `https://admin.codista.in/kiosk`

Assigned Access makes it harder to Alt+Tab or leave the page than a Startup shortcut alone.

Also useful:

- No other apps in that user’s Startup folder
- UPS so short power cuts don’t leave the machine off

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Stays on login screen | Redo auto-login (section C) |
| Browser does not open | Shortcut must be in `shell:startup` for `codista-kiosk` |
| Asks for PIN again | Paired under wrong user, or browser data cleared → redo D |
| Tap does nothing | Page not focused, not in kiosk mode, or reader unplugged |
| Outside class time | Tap during the member’s batch start–end window (Settings → Batches) |
| Member not mapped to any batch | Map the member to a batch with times |
| Sleeps overnight | Power = Never (section C) |
| Unknown card | Enroll the UID on the member; check device branch vs member branch |
| Wrong branch | Use the PIN for the correct **Kiosk devices** branch |

---

## Notes

- The HID reader acts like a keyboard. The kiosk page must stay focused for taps to register.
- Kiosk marks the mapped batch whose window contains **now (IST)**. Manual attendance on `/admin/attendance` can still mark anytime.
- Recent punches older than **3 days** are cleared automatically when staff use admin.
- Keep `/kiosk` as the door UI. The Windows RFID agent is optional and uses the same 4-digit PIN in `Agent.DeviceToken`.
