#!/usr/bin/env python3
"""
PoseCoach Fluid Pro AI BLE log analyzer.
READ-ONLY: parses nRF Connect text logs. Does not connect to Bluetooth or send writes.
"""
import re
import sys
from collections import Counter, defaultdict

HEX_RE = re.compile(r'(?:Characteristic\s+([A-Fa-f0-9]{4})\s+to\s+|")([A-Fa-f0-9 ]{8,})')
TS_RE = re.compile(r'^\[(\d{2}:\d{2}:\d{2}\.\d{3})\]')

def compact_hex(s: str) -> str:
    return ''.join(s.split()).upper()

def parse_packet(h: str):
    raw=bytes.fromhex(h)
    out={"raw":h,"len":len(raw),"valid_frame":False}
    if len(raw)>=5 and raw[:2]==b"\xAA\x55" and raw[-1:]==b"\xFF":
        out["valid_frame"]=True
        out["length_byte"]=raw[2]
        out["checksum_byte"]=raw[-2]
        out["checksum_sum_2_to_before_checksum"]=sum(raw[2:-2]) & 0xFF
        out["checksum_matches"]=out["checksum_byte"]==out["checksum_sum_2_to_before_checksum"]
        out["body"]=raw[3:-2].hex(' ').upper()
        if len(raw)>=9:
            out["tail_payload"]=raw[-5:-2].hex(' ').upper()
    return out

def analyze(lines):
    events=[]
    for line in lines:
        if "Updated Value of Characteristic" not in line:
            continue
        m=HEX_RE.search(line)
        if not m:
            continue
        char=(m.group(1) or "????").upper()
        h=compact_hex(m.group(2))
        ts=TS_RE.search(line)
        info=parse_packet(h)
        info.update({"characteristic":char,"timestamp":ts.group(1) if ts else None})
        events.append(info)

    print(f"Parsed {len(events)} notification updates")
    bychar=defaultdict(list)
    for e in events: bychar[e["characteristic"]].append(e)

    for char, evs in sorted(bychar.items()):
        print(f"\nCharacteristic {char}: {len(evs)} updates")
        counts=Counter(e["raw"] for e in evs)
        for raw,count in counts.most_common():
            p=parse_packet(raw)
            extra=""
            if p.get("valid_frame"):
                extra=f" checksum={'OK' if p.get('checksum_matches') else 'FAIL'}"
            print(f"  {count:4d}x {raw}{extra}")

    print("\nTimeline:")
    for e in events:
        status=""
        if e.get("valid_frame"):
            status=f" checksum={'OK' if e.get('checksum_matches') else 'FAIL'}"
        print(f"  {e['timestamp'] or '--:--:--.---'} {e['characteristic']} {e['raw']}{status}")

if __name__=="__main__":
    if len(sys.argv)!=2:
        print("Usage: fluid_ble_log_analyzer.py <nrf_log.txt>")
        raise SystemExit(2)
    with open(sys.argv[1],"r",encoding="utf-8",errors="replace") as f:
        analyze(f)
