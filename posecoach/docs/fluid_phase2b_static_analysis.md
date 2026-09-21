# Fluid Pro AI — Phase 2B Static Analysis Report

Date: 2026-09-20
Status: READ-ONLY / NO MOTOR WRITES AUTHORIZED

## Scope
Phase 2B was approved to identify the Fluid Pro AI control protocol without sending experimental motor commands.

## Current-device evidence from our live probe
Observed on the user's Fluid Pro AI:
- BLE service FFE0
- FFE1: Write / Write Without Response
- FFE2: Notify
- FFE3: Write Without Response
- FFE4: Notify
- AE00
- AE01: Write Without Response
- AE02: Notify
- Device Information service
- HID exposure

Physical joystick experiment:
- FFE2 reacts to joystick use.
- LEFT, RIGHT, UP and DOWN all emitted the same pair:
  - AA 55 07 00 00 B0 01 B8 FF
  - AA 55 07 00 00 B0 02 B9 FF
- Therefore B0 01 / B0 02 is direction-independent for this test and is treated as generic activity/state, not directional motor data.
- FFE4 did not emit correlated joystick data.
- AE02 did not emit correlated joystick data.

## Packet framing evidence
Observed frames consistently use:
- AA 55 header
- payload/length fields
- additive one-byte checksum behavior
- FF terminator

The B8/B9 checksum bytes in the observed B0 packets match the 8-bit additive sum of the bytes between the header and checksum.

This structural behavior also matches an independent clean-room extraction of older Hohem/YC Onion gimbal protocols:
- service FFE0
- write FFE1
- notify FFE2
- frame includes length + device ID + command + payload + additive checksum + terminator
- recovered operations in that older family include move, stop, reset and angle query

Important: those older adapters were protocol-recovered but not hardware-verified against this Fluid Pro AI model, so command values are NOT treated as valid for our device.

## Current GoPro Fluid Android app
Public package:
- com.bsteadyqnew.gopro
- developer: Hohem
- current public version observed: 1.00.06
- updated June 2026
- the app advertises remote control, AI tracking, gimbal settings, motor speed and sensitivity controls
- Android metadata includes Bluetooth connect/advertise permissions

This confirms the official app has a phone-to-gimbal control path, but public metadata does not expose the motor command bytes.

## Third-party protocol evidence
A recent public repository exists that uses the exact AA55/B0 packet seen in our live Fluid telemetry, but its own README states that its command hypotheses are unconfirmed. It is therefore excluded from command authorization.

## Safety classification
SAFE / confirmed:
- device identity
- FFE0 transport presence
- FFE2 notification path
- additive checksum behavior
- physical joystick activity event
- AE02 silence for physical joystick test

PROVISIONAL:
- FFE1 is the most plausible primary control write channel because it matches older Hohem family transports and our service layout.
- FFE3 may serve a secondary command/control path on Fluid Pro AI.
- B0 event meaning is generic movement/activity state rather than direction.

NOT CONFIRMED:
- pan command ID
- tilt command ID
- stop command
- absolute-angle command
- speed encoding
- axis encoding
- whether FFE1 or FFE3 is used by the Fluid app for joystick motor movement
- whether Fluid Pro AI reuses older Hohem command IDs

## Gate status
Phase 2B static correlation: PARTIAL PASS

Enough evidence exists to narrow the likely transport, but not enough to authorize a write.

Motor write gate remains LOCKED.

## Next safest evidence step
Preferred:
1. Obtain the official GoPro Fluid Android APK/XAPK bytes for version 1.00.06 (or a close version).
2. Decompile locally.
3. Search for:
   - FFE0 / FFE1 / FFE2 / FFE3 / FFE4
   - AA55 / 0xAA 0x55
   - BluetoothGattCharacteristic.write*
   - joystick / rocker / pan / tilt / yaw / pitch
   - motor speed / sensitivity
   - checksum builder
4. Trace the exact method invoked by the on-screen remote joystick.
5. Identify STOP before any MOVE packet.
6. Produce another report and request explicit approval before sending a bounded command.

Fallback if APK static analysis is unavailable:
- capture official-app BLE traffic on an Android device with Bluetooth HCI snoop logging or another passive BLE sniffer.
- do not infer motor commands by brute force.

## Hard restrictions
- No writes to AE01.
- No brute-force command sweep.
- No guessed pan/tilt packet.
- No continuous director motor access until stop, bounds, command semantics and recovery behavior are verified.
