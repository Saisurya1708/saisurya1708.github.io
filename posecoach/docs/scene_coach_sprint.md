# PoseCoach — Scene Coach Sprint

## PRODUCT LEAD
The product's signature interaction is now **Scene Coach**:
1. Camera sees a real person.
2. PoseCoach makes a temporary visual proxy from that person.
3. A target version of that same person appears as a ghost/miniature visual guide.
4. Subject movement and photographer/camera movement animate simultaneously.
5. Text is secondary to the visual explanation.

The skeleton/keypoint representation is internal machinery only.

## POSE TAXONOMIST
Pose records now need a shot transformation, not only body coordinates:
- subject movement
- camera movement
- target crop
- sequencing
- visual demo instructions

One instruction step can affect both actors if the visual animation shows both simultaneously.

## DATA ARCHITECT
Add a shot_transform layer:
- subject_transform
- camera_transform
- framing_transform
- coach_animation
- machine_observable_fields

The stored pose remains generic. The subject proxy is ephemeral session data and is never written into the pose library.

## COMPUTER VISION ENGINEER
Browser prototype:
- MediaPipe Pose Landmarker (lite)
- single still scan with segmentation mask for the visual proxy
- optional live landmark tracking without drawing a skeleton
- on-device image processing
- no generated likeness in this sprint

Production native path remains Vision/AVFoundation or a benchmarked equivalent.

## MOBILE ENGINEER
The web build is an interaction-validation prototype, not the final camera architecture.
The production app must preserve native camera capability through public iOS camera APIs.

## UX/UI DESIGNER
Two visual layers:
1. **Ghost Me** — translucent target representation over the camera.
2. **Scene Coach** — floating mini-stage showing the actual subject proxy and a virtual camera moving together.

The popup is replayable. The photographer should understand the move without reading photography vocabulary.

## LEARNING DESIGNER
Scene Coach becomes a teaching unit:
- "You move like this."
- "I move the camera like this."
- "This is how the final framing changes."

As skill increases, the popup and ghost fade away.

## CONTENT & LEGAL
The proxy comes from the current camera session. It is not a reusable identity asset.
For the lean prototype:
- no cloud upload
- no face recognition
- no identity matching
- no persistent biometric profile

## RED TEAM
Failure conditions:
- person partly outside frame
- segmentation cuts off hair/hands
- long clothing merges limbs
- low light
- multiple people
- proxy looks distorted
- camera preview aspect ratio differs from scan crop

Fallback:
If segmentation is unusable, display a cropped photographic proxy of the actual subject with background still present. Never substitute a stick figure.

## THE COUNCIL

### D-018 — Subject-first visual coaching
**Vote:** 9–0
**Ruling:** User-facing guidance uses the actual subject as the visual basis. Skeletons are internal.

### D-019 — No generative likeness required for the first Scene Coach prototype
**Tradeoff:** Photorealistic re-posing vs. speed, privacy, and technical reliability.
**Vote:** 8–1
**Ruling:** Build the first proxy from a real camera frame plus segmentation and lightweight articulation/transform animation. Generative re-posing is deferred until the interaction itself is validated.
**Dissent:** Product Lead wants later experiments with higher-fidelity target rendering once latency/cost/privacy are known.

### D-020 — Visual fallback hierarchy
**Vote:** 9–0
**Ruling:** segmented subject proxy → cropped real-photo proxy → static real-photo reference. Never fall back to a stick figure in the user experience.

## Sprint acceptance test
On an iPhone:
1. Open live camera.
2. Put one full person in frame.
3. Tap Scan me.
4. PoseCoach extracts that person visually.
5. The same person's representation appears in Ghost Me and Scene Coach.
6. Replay animates subject movement and virtual camera movement simultaneously.
7. Next instruction changes both the text cue and visual motion.
