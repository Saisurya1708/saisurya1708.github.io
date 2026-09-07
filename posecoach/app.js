
const $ = (id) => document.getElementById(id);

const landing = $("landing");
const cameraScreen = $("cameraScreen");
const result = $("result");
const video = $("video");
const overlay = $("overlay");
const ctx = overlay.getContext("2d");
const captureCanvas = $("captureCanvas");
const captureCtx = captureCanvas.getContext("2d");

let stream = null;
let facingMode = "environment";
let overlayVisible = true;
let lastBlob = null;

const cues = [
  "Put most of your weight on the leg farther from the camera.",
  "Turn your chest slightly away from the camera.",
  "Let the camera-side knee soften instead of locking it.",
  "Put your camera-side thumb lightly in a pocket; leave the fingers visible.",
  "Bring your chin a little forward, then lower it slightly.",
  "Hold the pose. Keep your shoulders relaxed."
];
let cueIndex = 0;

function setCue() {
  $("cue").textContent = cues[cueIndex];
}

async function startCamera() {
  const landingStatus = $("landingStatus");
  const cameraStatus = $("cameraStatus");
  landingStatus.textContent = "";

  if (!window.isSecureContext) {
    landingStatus.textContent = "Camera access needs a secure HTTPS page.";
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    landingStatus.textContent = "Safari camera access is unavailable on this page.";
    return;
  }

  try {
    if (stream) stream.getTracks().forEach(t => t.stop());

    // Ask for the preferred camera first, then fall back to any camera.
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
    } catch (preferredError) {
      console.warn("Preferred camera request failed; falling back.", preferredError);
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }

    // Make the viewfinder visible BEFORE asking the inline video to play.
    landing.hidden = true;
    result.hidden = true;
    cameraScreen.hidden = false;

    video.srcObject = stream;
    video.muted = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");

    cameraStatus.textContent = "Starting camera…";

    // iPhone Safari can reject play() while a video is hidden. At this point it is visible.
    try {
      await video.play();
    } catch (playError) {
      console.warn("Explicit video.play() failed; autoplay may still start.", playError);
    }

    // Give Safari a moment to expose video dimensions, then draw the guide.
    await new Promise(resolve => {
      if (video.readyState >= 2 && video.videoWidth) return resolve();
      const done = () => resolve();
      video.addEventListener("loadedmetadata", done, { once: true });
      setTimeout(done, 1200);
    });

    cameraStatus.textContent =
      facingMode === "environment" ? "Rear camera · first test" : "Front camera · first test";
    resizeOverlay();
    requestAnimationFrame(drawOverlay);
  } catch (err) {
    console.error(err);
    stopCamera();
    cameraScreen.hidden = true;
    landing.hidden = false;
    const name = err?.name || "CameraError";
    const message = err?.message || "Unknown camera error";
    landingStatus.textContent = `Camera failed: ${name}. ${message}`;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

function resizeOverlay() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const r = overlay.getBoundingClientRect();
  overlay.width = Math.round(r.width * dpr);
  overlay.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

function drawOverlay() {
  if (cameraScreen.hidden) return;
  const w = overlay.clientWidth;
  const h = overlay.clientHeight;
  ctx.clearRect(0, 0, w, h);
  if (overlayVisible) drawRelaxedWallLean(w, h);
  requestAnimationFrame(drawOverlay);
}

function line(a,b) {
  ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
}
function circle(p,r=7) {
  ctx.beginPath(); ctx.arc(p[0],p[1],r,0,Math.PI*2); ctx.stroke();
}

function drawRelaxedWallLean(w,h) {
  const opacity = Number($("opacity").value) / 100;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0,0,0,.45)";
  ctx.shadowBlur = 5;

  const cx = w * 0.52;
  const top = h * 0.16;
  const H = h * 0.67;
  const p = {
    head:[cx+8, top], neck:[cx+4, top+H*.11], ls:[cx-32, top+H*.16], rs:[cx+35, top+H*.14],
    le:[cx-47, top+H*.31], re:[cx+55, top+H*.29], lw:[cx-28, top+H*.43], rw:[cx+43, top+H*.42],
    hip:[cx+8, top+H*.47], lk:[cx-2, top+H*.67], rk:[cx+28, top+H*.69],
    la:[cx-19, top+H*.90], ra:[cx+52, top+H*.91], lf:[cx-34, top+H*.96], rf:[cx+72, top+H*.96]
  };
  circle(p.head, 22);
  line(p.neck,p.ls); line(p.neck,p.rs); line(p.ls,p.le); line(p.le,p.lw); line(p.rs,p.re); line(p.re,p.rw);
  line(p.neck,p.hip); line(p.hip,p.lk); line(p.lk,p.la); line(p.la,p.lf); line(p.hip,p.rk); line(p.rk,p.ra); line(p.ra,p.rf);

  ctx.setLineDash([9,10]);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w*.70, h*.19); ctx.lineTo(w*.70, h*.83); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = "600 12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("wall", w*.70+8, h*.24);
  ctx.restore();
}

async function countdownCapture() {
  const count = $("countdown");
  count.hidden = false;
  for (const n of [5,4,3,2,1]) {
    count.textContent = n;
    await new Promise(r => setTimeout(r, 1000));
  }
  count.textContent = "";
  captureFrame();
  count.hidden = true;
}

function captureFrame() {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return;
  captureCanvas.width = vw; captureCanvas.height = vh;
  if (facingMode === "user") {
    captureCtx.save(); captureCtx.translate(vw, 0); captureCtx.scale(-1, 1); captureCtx.drawImage(video, 0, 0, vw, vh); captureCtx.restore();
  } else captureCtx.drawImage(video, 0, 0, vw, vh);
  captureCanvas.toBlob(blob => {
    lastBlob = blob;
    $("captured").src = URL.createObjectURL(blob);
    cameraScreen.hidden = true;
    result.hidden = false;
  }, "image/jpeg", 0.94);
}

$("startBtn").addEventListener("click", startCamera);
$("backBtn").addEventListener("click", () => { stopCamera(); cameraScreen.hidden = true; landing.hidden = false; });
$("flipBtn").addEventListener("click", async () => { facingMode = facingMode === "environment" ? "user" : "environment"; await startCamera(); });
$("guideToggle").addEventListener("click", () => { overlayVisible = !overlayVisible; $("guideToggle").textContent = overlayVisible ? "Guide" : "Off"; });
$("nextCue").addEventListener("click", () => { cueIndex = (cueIndex + 1) % cues.length; setCue(); });
$("shutter").addEventListener("click", countdownCapture);
$("retakeBtn").addEventListener("click", async () => { result.hidden = true; cameraScreen.hidden = false; if (!stream) await startCamera(); });
$("shareBtn").addEventListener("click", async () => {
  $("shareStatus").textContent = "";
  if (!lastBlob) return;
  const file = new File([lastBlob], "posecoach-test.jpg", { type: "image/jpeg" });
  try {
    if (navigator.canShare?.({files:[file]})) {
      await navigator.share({ files:[file], title:"PoseCoach test shot" });
      $("shareStatus").textContent = "Opened the iPhone share sheet.";
    } else {
      const url = URL.createObjectURL(lastBlob); const a = document.createElement("a"); a.href = url; a.download = "posecoach-test.jpg"; a.click();
      $("shareStatus").textContent = "Saved/downloaded the test image.";
    }
  } catch (e) { if (e.name !== "AbortError") $("shareStatus").textContent = "Share was unavailable. Long-press the image to save it."; }
});
window.addEventListener("resize", resizeOverlay);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && stream) stream.getTracks().forEach(t => t.enabled = false);
  if (!document.hidden && stream) stream.getTracks().forEach(t => t.enabled = true);
});
setCue();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
