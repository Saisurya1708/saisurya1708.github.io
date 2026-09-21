# Fluid Pro AI BLE tools

These tools are deliberately **read-only** during protocol discovery.

## fluid_ble_log_analyzer.py
Parses text exported from nRF Connect and reports:
- characteristic
- timestamp
- unique packet values
- packet frequency
- AA55...FF frame detection
- observed one-byte additive checksum validation

It does **not** connect to Bluetooth and cannot move the gimbal.

Usage:

```bash
python fluid_ble_log_analyzer.py nrf_log.txt
```

## Current protocol gate
Known from live Fluid Pro AI testing:
- FFE0 service present
- FFE2 reacts to physical joystick activity
- LEFT/RIGHT/UP/DOWN produced the same B0 01 -> B0 02 pair
- FFE4 showed no correlated joystick notifications
- AE02 showed no correlated joystick notifications

No motor command is authorized until a real STOP command and bounded MOVE semantics are independently verified.
