import importlib
import base64
import os
from io import BytesIO
import streamlit as st
import pandas as pd
import requests
import sys
from pathlib import Path
from PIL import Image
from streamlit.components.v1 import html

# Project root so imports and data paths work from any cwd
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import models.recommender as recommender_module

recommender_module = importlib.reload(recommender_module)
FashionRecommender = recommender_module.FashionRecommender

st.set_page_config(page_title="AFLALO AI Prototype", layout="wide")

# Inject Streamlit secrets into env so recommender's os.getenv("GEMINI_API_KEY") works on Community Cloud
try:
    if "GEMINI_API_KEY" in st.secrets:
        os.environ["GEMINI_API_KEY"] = str(st.secrets["GEMINI_API_KEY"])
except Exception:
    pass

DATA_DIR = ROOT / "data"


def _product_id_for_name(products, name):
    """Resolve product id from name; when duplicates exist, prefer the row with a price."""
    rows = products[products["name"] == name]
    if rows.empty:
        return None
    if len(rows) > 1:
        with_price = rows[rows["price"].fillna(0).gt(0)]
        if not with_price.empty:
            return int(with_price["id"].iloc[0])
    return int(rows["id"].iloc[0])


@st.cache_data(show_spinner=False)
def build_overlay_asset(image_url):
    """Convert a product image into a transparent overlay asset for live try-on."""
    if not image_url:
        return None

    response = requests.get(str(image_url), timeout=20)
    response.raise_for_status()

    image = Image.open(BytesIO(response.content)).convert("RGBA")
    rgba = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = rgba[x, y]
            is_light = r > 220 and g > 220 and b > 220
            is_neutral = max(abs(r - g), abs(g - b), abs(r - b)) < 18
            if is_light and is_neutral:
                rgba[x, y] = (r, g, b, 0)

    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        image = image.crop(bbox)

    image.thumbnail((520, 700))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def overlay_defaults(category):
    """Provide simple default overlay positioning by product category."""
    category_str = str(category).strip().lower()
    if category_str in {"outerwear", "jacket", "coat"}:
        return {"scale": 0.92, "offset_x": 0, "offset_y": -10}
    if category_str in {"dress", "dresses"}:
        return {"scale": 0.92, "offset_x": 0, "offset_y": 10}
    if category_str in {"top", "tops", "sweater"}:
        return {"scale": 0.9, "offset_x": 0, "offset_y": -45}
    if category_str in {"bottom", "bottoms", "denim", "trouser"}:
        return {"scale": 0.9, "offset_x": 0, "offset_y": 115}
    return {"scale": 0.9, "offset_x": 0, "offset_y": 0}


def render_live_try_on_component(overlay_data_url, defaults, component_key):
    """Render a client-side webcam try-on preview with timer and snapshot capture."""
    if not overlay_data_url:
        st.warning("The selected product image could not be converted into an overlay asset.")
        return

    html(
        f"""
        <div id="tryon-root-{component_key}" style="font-family: Inter, sans-serif; color: #F5F5F5;">
          <style>
            #tryon-root-{component_key} .tryon-shell {{
              background: #111318;
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 16px;
              padding: 16px;
            }}
            #tryon-root-{component_key} .tryon-stage {{
              position: relative;
              width: 100%;
              aspect-ratio: 3 / 4;
              background: linear-gradient(180deg, #1A1D24 0%, #0F1117 100%);
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid rgba(255,255,255,0.06);
            }}
            #tryon-root-{component_key} .tryon-stage video {{
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              transform: scaleX(-1);
              z-index: 0;
            }}
            #tryon-root-{component_key} .tryon-stage canvas {{
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: block;
              z-index: 1;
            }}
            #tryon-root-{component_key} .countdown {{
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 84px;
              font-weight: 700;
              color: rgba(255,255,255,0.92);
              text-shadow: 0 10px 40px rgba(0,0,0,0.55);
              pointer-events: none;
              opacity: 0;
              transition: opacity 180ms ease;
            }}
            #tryon-root-{component_key} .controls {{
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px 18px;
              margin-top: 16px;
            }}
            #tryon-root-{component_key} .button-row {{
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 14px;
            }}
            #tryon-root-{component_key} button, #tryon-root-{component_key} a {{
              background: #1E232E;
              color: #F5F5F5;
              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 10px;
              padding: 10px 14px;
              font-size: 14px;
              text-decoration: none;
              cursor: pointer;
            }}
            #tryon-root-{component_key} .primary {{
              background: #E7D8C6;
              color: #111318;
              border-color: transparent;
            }}
            #tryon-root-{component_key} label {{
              display: block;
              font-size: 12px;
              color: #B8BDC8;
              margin-bottom: 6px;
            }}
            #tryon-root-{component_key} input[type=range] {{
              width: 100%;
            }}
            #tryon-root-{component_key} .status {{
              margin-top: 12px;
              font-size: 13px;
              color: #B8BDC8;
            }}
            #tryon-root-{component_key} .snapshot-wrap {{
              margin-top: 16px;
              min-height: 200px;
            }}
            #tryon-root-{component_key} .snapshot-wrap img {{
              display: none;
              max-width: 100%;
              width: 100%;
              height: auto;
              object-fit: contain;
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.08);
            }}
          </style>
          <div class="tryon-shell">
            <div class="tryon-stage">
              <video id="video-{component_key}" autoplay playsinline muted></video>
              <canvas id="canvas-{component_key}"></canvas>
              <div id="countdown-{component_key}" class="countdown">5</div>
            </div>

            <div class="button-row">
              <button id="start-camera-{component_key}" class="primary">Launch Camera</button>
              <button id="start-timer-{component_key}">Start 5s Timer</button>
              <button id="capture-now-{component_key}">Capture Now</button>
              <button id="reset-fit-{component_key}">Reset Fit</button>
              <button id="stop-camera-{component_key}">Stop Camera</button>
              <a id="download-{component_key}" download="aflalo-live-tryon.png" href="#" style="display:none;">Download Snapshot</a>
            </div>

            <div class="controls">
              <div>
                <label for="scale-{component_key}">Scale</label>
                <input id="scale-{component_key}" type="range" min="0.5" max="1.35" step="0.01" value="{defaults["scale"]}">
              </div>
              <div>
                <label for="opacity-{component_key}">Opacity</label>
                <input id="opacity-{component_key}" type="range" min="0.35" max="1" step="0.01" value="0.94">
              </div>
              <div>
                <label for="offset-x-{component_key}">Horizontal Position</label>
                <input id="offset-x-{component_key}" type="range" min="-220" max="220" step="1" value="{defaults["offset_x"]}">
              </div>
              <div>
                <label for="offset-y-{component_key}">Vertical Position</label>
                <input id="offset-y-{component_key}" type="range" min="-260" max="260" step="1" value="{defaults["offset_y"]}">
              </div>
            </div>

            <div id="status-{component_key}" class="status">
              Launch the camera, drag the overlay if needed, then start the 5-second timer and step into frame.
            </div>

            <div class="snapshot-wrap">
              <img id="snapshot-{component_key}" alt="Captured try-on preview"/>
            </div>
          </div>
        </div>
        <script>
          (() => {{
            const overlaySrc = "{overlay_data_url}";
            const video = document.getElementById("video-{component_key}");
            const canvas = document.getElementById("canvas-{component_key}");
            const ctx = canvas.getContext("2d");
            const countdownEl = document.getElementById("countdown-{component_key}");
            const statusEl = document.getElementById("status-{component_key}");
            const snapshotImg = document.getElementById("snapshot-{component_key}");
            const downloadLink = document.getElementById("download-{component_key}");
            const resetFitButton = document.getElementById("reset-fit-{component_key}");
            const scaleInput = document.getElementById("scale-{component_key}");
            const opacityInput = document.getElementById("opacity-{component_key}");
            const offsetXInput = document.getElementById("offset-x-{component_key}");
            const offsetYInput = document.getElementById("offset-y-{component_key}");

            const overlay = new Image();
            overlay.src = overlaySrc;

            let stream = null;
            let animationFrame = null;
            let countdownTimer = null;
            let overlayRect = null;
            let dragState = null;
            let hasShownLiveStatus = false;

            const state = {{
              scale: parseFloat(scaleInput.value),
              opacity: parseFloat(opacityInput.value),
              offsetX: parseFloat(offsetXInput.value),
              offsetY: parseFloat(offsetYInput.value),
            }};

            const defaultState = {{
              scale: parseFloat(scaleInput.value),
              offsetX: parseFloat(offsetXInput.value),
              offsetY: parseFloat(offsetYInput.value),
            }};

            function syncStateFromControls() {{
              state.scale = parseFloat(scaleInput.value);
              state.opacity = parseFloat(opacityInput.value);
              state.offsetX = parseFloat(offsetXInput.value);
              state.offsetY = parseFloat(offsetYInput.value);
            }}

            function resizeCanvas() {{
              const rect = canvas.getBoundingClientRect();
              if (rect.width <= 0 || rect.height <= 0) return;
              canvas.width = Math.max(320, Math.round(rect.width));
              canvas.height = Math.max(240, Math.round(rect.height));
            }}

            function clamp(value, min, max) {{
              return Math.max(min, Math.min(max, value));
            }}

            function updatePositionControls() {{
              offsetXInput.value = Math.round(state.offsetX);
              offsetYInput.value = Math.round(state.offsetY);
            }}

            function fitOverlayToStage() {{
              if (!overlay.complete) {{
                return null;
              }}

              const baseFitWidth = canvas.width * 0.72;
              const baseFitHeight = canvas.height * 0.82;
              const fitRatio = Math.min(baseFitWidth / overlay.width, baseFitHeight / overlay.height);
              const overlayWidth = overlay.width * fitRatio * state.scale;
              const overlayHeight = overlay.height * fitRatio * state.scale;
              const maxOffsetX = Math.max(0, (canvas.width - overlayWidth) / 2);
              const maxOffsetY = Math.max(0, (canvas.height - overlayHeight) / 2);
              state.offsetX = clamp(state.offsetX, -maxOffsetX, maxOffsetX);
              state.offsetY = clamp(state.offsetY, -maxOffsetY, maxOffsetY);
              updatePositionControls();

              return {{
                width: overlayWidth,
                height: overlayHeight,
              }};
            }}

            function drawFrame() {{
              resizeCanvas();
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {{
                if (!hasShownLiveStatus) {{
                  hasShownLiveStatus = true;
                  statusEl.textContent = "Camera is live. Drag the overlay on the preview or use the sliders to fine-tune placement.";
                }}
                const vw = video.videoWidth;
                const vh = video.videoHeight;
                const scale = Math.max(canvas.width / vw, canvas.height / vh);
                const dw = Math.round(vw * scale);
                const dh = Math.round(vh * scale);
                const dx = (canvas.width - dw) / 2;
                const dy = (canvas.height - dh) / 2;
                ctx.save();
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.translate(-canvas.width, 0);
                ctx.drawImage(video, dx, dy, dw, dh);
                ctx.restore();
              }} else {{
                ctx.fillStyle = "#171A20";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }}

              if (overlay.complete) {{
                const fitted = fitOverlayToStage();
                const overlayWidth = fitted.width;
                const overlayHeight = fitted.height;
                const overlayX = (canvas.width - overlayWidth) / 2 + state.offsetX;
                const overlayY = (canvas.height - overlayHeight) / 2 + state.offsetY;
                overlayRect = {{ x: overlayX, y: overlayY, width: overlayWidth, height: overlayHeight }};

                ctx.globalAlpha = state.opacity;
                ctx.drawImage(overlay, overlayX, overlayY, overlayWidth, overlayHeight);
                ctx.globalAlpha = 1;
              }}

              animationFrame = requestAnimationFrame(drawFrame);
            }}

            function timeoutPromise(ms, msg) {{
              return new Promise(function(_, reject) {{
                setTimeout(function() {{ reject(new Error(msg)); }}, ms);
              }});
            }}

            async function startCamera() {{
              try {{
                if (stream) {{
                  stopCamera();
                }}
                statusEl.textContent = "Requesting camera permission…";
                var getStream = navigator.mediaDevices.getUserMedia({{
                  video: {{ facingMode: "user" }},
                  audio: false
                }});
                stream = await Promise.race([
                  getStream,
                  timeoutPromise(15000, "getUserMedia timed out")
                ]);
                statusEl.textContent = "Starting preview…";
                video.muted = true;
                video.playsInline = true;
                video.setAttribute("playsinline", "");
                video.srcObject = stream;
                video.play().catch(function() {{ /* don't block on play(); draw loop will show frames when ready */ }});
                if (animationFrame) {{
                  cancelAnimationFrame(animationFrame);
                }}
                drawFrame();
                statusEl.textContent = "Starting preview… (if it stays blank, try Stop Camera then Launch Camera again)";
                setTimeout(function() {{
                  if (stream && video.readyState < 2) {{
                    statusEl.textContent = "Preview not receiving frames. Try Stop Camera, then Launch Camera again, or open the app in a new tab.";
                  }}
                }}, 4000);
              }} catch (error) {{
                if (stream) {{
                  stream.getTracks().forEach(function(track) {{ track.stop(); }});
                  stream = null;
                }}
                var msg = error.message || String(error);
                if (msg.indexOf("timed out") !== -1) {{
                  statusEl.textContent = "Camera timed out. If no permission prompt appeared, try opening the app in a new tab or allow camera in site settings, then try again.";
                }} else if (msg.indexOf("Permission") !== -1 || msg.indexOf("NotAllowed") !== -1) {{
                  statusEl.textContent = "Camera access denied. Allow the camera for this site in your browser and click Launch Camera again.";
                }} else if (msg.indexOf("NotFound") !== -1) {{
                  statusEl.textContent = "No camera found. Connect a webcam and refresh the page.";
                }} else {{
                  statusEl.textContent = "Camera failed: " + msg;
                }}
              }}
            }}

            function stopCamera() {{
              hasShownLiveStatus = false;
              if (countdownTimer) {{
                clearInterval(countdownTimer);
                countdownTimer = null;
              }}
              countdownEl.style.opacity = 0;
              if (animationFrame) {{
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
              }}
              if (stream) {{
                stream.getTracks().forEach(track => track.stop());
                stream = null;
              }}
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              statusEl.textContent = "Camera stopped.";
            }}

            function resetFit() {{
              state.scale = defaultState.scale;
              state.offsetX = defaultState.offsetX;
              state.offsetY = defaultState.offsetY;
              scaleInput.value = String(defaultState.scale);
              updatePositionControls();
              statusEl.textContent = "Overlay reset to the default fitted position.";
            }}

            function captureSnapshot() {{
              const dataUrl = canvas.toDataURL("image/png");
              snapshotImg.src = dataUrl;
              snapshotImg.style.display = "block";
              downloadLink.href = dataUrl;
              downloadLink.style.display = "inline-flex";
              statusEl.textContent = "Snapshot captured. Download it or adjust the overlay and capture again.";
              snapshotImg.scrollIntoView({{ behavior: "smooth", block: "center" }});
            }}

            function startTimer() {{
              if (!stream) {{
                statusEl.textContent = "Launch the camera before starting the timer.";
                return;
              }}
              if (countdownTimer) {{
                clearInterval(countdownTimer);
              }}
              let remaining = 5;
              countdownEl.textContent = String(remaining);
              countdownEl.style.opacity = 1;
              statusEl.textContent = "Timer started. Step into frame.";
              countdownTimer = setInterval(() => {{
                remaining -= 1;
                if (remaining > 0) {{
                  countdownEl.textContent = String(remaining);
                }} else {{
                  clearInterval(countdownTimer);
                  countdownTimer = null;
                  countdownEl.style.opacity = 0;
                  captureSnapshot();
                }}
              }}, 1000);
            }}

            function pointerPosition(event) {{
              const rect = canvas.getBoundingClientRect();
              const clientX = event.touches ? event.touches[0].clientX : event.clientX;
              const clientY = event.touches ? event.touches[0].clientY : event.clientY;
              return {{
                x: ((clientX - rect.left) / rect.width) * canvas.width,
                y: ((clientY - rect.top) / rect.height) * canvas.height,
              }};
            }}

            function handlePointerDown(event) {{
              if (!overlayRect) return;
              const pos = pointerPosition(event);
              const inside =
                pos.x >= overlayRect.x &&
                pos.x <= overlayRect.x + overlayRect.width &&
                pos.y >= overlayRect.y &&
                pos.y <= overlayRect.y + overlayRect.height;
              if (!inside) return;
              dragState = {{
                startX: pos.x,
                startY: pos.y,
                originX: state.offsetX,
                originY: state.offsetY,
              }};
              event.preventDefault();
            }}

            function handlePointerMove(event) {{
              if (!dragState) return;
              const pos = pointerPosition(event);
              const deltaX = pos.x - dragState.startX;
              const deltaY = pos.y - dragState.startY;
              state.offsetX = dragState.originX + deltaX;
              state.offsetY = dragState.originY + deltaY;
              offsetXInput.value = Math.round(state.offsetX);
              offsetYInput.value = Math.round(state.offsetY);
              event.preventDefault();
            }}

            function handlePointerUp() {{
              dragState = null;
            }}

            document.getElementById("start-camera-{component_key}").addEventListener("click", startCamera);
            document.getElementById("stop-camera-{component_key}").addEventListener("click", stopCamera);
            document.getElementById("capture-now-{component_key}").addEventListener("click", captureSnapshot);
            document.getElementById("start-timer-{component_key}").addEventListener("click", startTimer);
            resetFitButton.addEventListener("click", resetFit);
            [scaleInput, opacityInput, offsetXInput, offsetYInput].forEach(input => {{
              input.addEventListener("input", syncStateFromControls);
            }});

            canvas.addEventListener("mousedown", handlePointerDown);
            canvas.addEventListener("mousemove", handlePointerMove);
            window.addEventListener("mouseup", handlePointerUp);
            canvas.addEventListener("touchstart", handlePointerDown, {{ passive: false }});
            canvas.addEventListener("touchmove", handlePointerMove, {{ passive: false }});
            window.addEventListener("touchend", handlePointerUp);
            window.addEventListener("resize", resizeCanvas);

            resizeCanvas();
            drawFrame();
          }})();
        </script>
        """,
        height=2200,
    )


def show_product_card(row, show_image=True):
    """Render a product row with optional image."""
    has_image = show_image and pd.notna(row.get("image_url")) and str(row.get("image_url", "")).strip()
    if has_image:
        st.image(str(row["image_url"]), width="stretch")
    st.write(f"**{row['name']}**")
    p = row.get("price")
    if p is None or (isinstance(p, (int, float)) and float(p) <= 0):
        st.write("Price on request")
    elif isinstance(p, (int, float)):
        st.write(f"${float(p):,.0f}")
    else:
        st.write(f"${p}")
    if pd.notna(row.get("color")) and str(row.get("color", "")).strip():
        st.write(f"Color: {row['color']}")
    if pd.notna(row.get("description")) and str(row.get("description", "")).strip():
        st.caption(row["description"][:200] + ("..." if len(str(row["description"])) > 200 else ""))


def set_comparison_target(product_id, candidate_id):
    """Persist the current comparison choice in session state."""
    st.session_state[f"comparison_target_{product_id}"] = int(candidate_id)


def set_uploaded_comparison_target(state_key, candidate_id):
    """Persist the selected comparison result for uploaded closet flows."""
    st.session_state[state_key] = int(candidate_id)


def ensure_visual_match_columns(rec, product_id, recommendations):
    """Backfill vision fields if an older cached recommender returns plain product rows."""
    required_columns = {"compatibility_score", "style_reason"}
    if required_columns.issubset(recommendations.columns):
        return recommendations

    active_rec = rec
    if not hasattr(rec, "analyze_pairing"):
        active_rec = build_recommender()

    enriched = recommendations.copy()
    scores = []
    reasons = []
    for _, row in enriched.iterrows():
        analysis = active_rec.analyze_pairing(product_id, int(row["id"]))
        scores.append(analysis["compatibility_score"])
        reasons.append(analysis["style_reason"])

    enriched["compatibility_score"] = scores
    enriched["style_reason"] = reasons
    return enriched.sort_values(
        by=["compatibility_score", "price"],
        ascending=[False, True],
    ).reset_index(drop=True)


# Initialize recommender
def build_recommender():
    """Build a fresh recommender instance from the current module code."""
    rec = FashionRecommender()
    rec.load_data(data_dir=DATA_DIR)
    return rec


# Bump this after recommender logic changes (e.g. upload color filter) so Cloud builds a fresh recommender
CACHE_VERSION = "cv-v21-light-gemini-plus-cv"

@st.cache_resource
def load_recommender(cache_version="cv-v19-closet-reason"):
    return build_recommender()


rec = load_recommender(CACHE_VERSION)
if not hasattr(rec, "analyze_pairing") or not hasattr(rec, "style_uploaded_item") or not hasattr(rec, "find_uploaded_similar_items"):
    rec = build_recommender()

# Title
st.title(" AFLALO AI Recommendation Engine")
st.markdown("**Live catalog from [aflalonyc.com](https://aflalonyc.com)** · Similar Items · Complete the Look · My Closet · Live Try-On · Size Prediction")

# Sidebar
st.sidebar.header("Demo Controls")
st.sidebar.caption(f"Recommender: {CACHE_VERSION}")
demo_mode = st.sidebar.selectbox(
    "Select Demo:",
    ["Similar Items", "Complete the Look", "My Closet", "Live Try-On", "Size Prediction"],
)
if st.sidebar.button("Reload recommender & catalog", help="Use after re-scraping or code changes so the app picks up latest data and logic. Click this if upload recommendations don’t reflect recent fixes (e.g. color)."):
    load_recommender.clear()
    st.rerun()

# Load products (with image_url from scrape)
products = pd.read_csv(DATA_DIR / "products.csv")

# Main content
if demo_mode == "Similar Items":
    st.header("Similar Items Recommendation")
    st.markdown("*Visual alternatives ranked by category, silhouette, palette, texture, and material cues from the live AFLALO product images.*")
    st.caption("Recommendations use perceptual color (LAB), product color names, and texture/silhouette from [aflalonyc.com](https://aflalonyc.com) catalog.")

    similar_product_names = products["name"].tolist()
    default_similar = "Mentra Jacket in Python Embossed Leather"
    similar_default_index = similar_product_names.index(default_similar) if default_similar in similar_product_names else 0
    selected_product = st.selectbox(
        "Select a product:",
        similar_product_names,
        index=similar_default_index,
    )
    product_id = _product_id_for_name(products, selected_product)

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Selected Product")
        selected = products[products["id"] == product_id].iloc[0]
        show_product_card(selected)
    with col2:
        st.subheader("Visually Similar Alternatives")
        similar = rec.get_similar_items(product_id, n=3)
        for idx, item in similar.iterrows():
            show_product_card(item)
            if "similarity_score" in item.index:
                st.metric("Similarity", f"{item['similarity_score']:.0f}%")
            if "similarity_reason" in item.index:
                st.caption(item["similarity_reason"])
            st.write("---")

elif demo_mode == "Complete the Look":
    st.header("Complete the Look")
    st.markdown("*Computer-vision-assisted outfit coordination using the live AFLALO product photos*")

    product_names = products["name"].tolist()
    # Default to second item so "Alere Top in Silk" isn't always the demo (index 0)
    default_complete_index = min(1, len(product_names) - 1) if product_names else 0
    selected_product = st.selectbox(
        "Select a product:",
        product_names,
        index=default_complete_index,
    )
    product_id = _product_id_for_name(products, selected_product)

    col1, col2 = st.columns([1.1, 1.4])
    with col1:
        st.subheader("Your Selection")
        selected = products[products["id"] == product_id].iloc[0]
        show_product_card(selected)
    with col2:
        st.subheader("Pairs Well With")
        with st.spinner("Analyzing color, texture, brightness, and pattern balance from the product images..."):
            complementary = rec.complete_the_look(product_id)
            complementary = ensure_visual_match_columns(rec, product_id, complementary)

        if complementary.empty:
            st.warning("No visual pairings were available for this product.")
            st.stop()

        recommendation_cols = st.columns(max(len(complementary), 1))
        for col, (_, item) in zip(recommendation_cols, complementary.iterrows()):
            with col:
                show_product_card(item)
                st.markdown(f"**{item['compatibility_score']:.0f}% Match**")
                st.write(item["style_reason"])
                if pd.notna(item.get("category")):
                    st.caption(f"Category: {item['category']}")
                st.button(
                    "Compare Side by Side",
                    key=f"compare-{product_id}-{item['id']}",
                    on_click=set_comparison_target,
                    args=(product_id, item["id"]),
                    width="stretch",
                )

        default_candidate_id = int(complementary.iloc[0]["id"])
        compare_id = st.session_state.get(
            f"comparison_target_{product_id}",
            default_candidate_id,
        )
        compared_item = complementary[complementary["id"] == compare_id]
        if compared_item.empty:
            compared_item = products[products["id"] == compare_id]
        compared_item = compared_item.iloc[0]
        pair_analysis = rec.analyze_pairing(product_id, int(compared_item["id"]))

        st.markdown("---")
        st.subheader("Side-by-Side Look Review")
        compare_col1, compare_col2 = st.columns(2)
        with compare_col1:
            st.caption("Base piece")
            show_product_card(selected)
        with compare_col2:
            st.caption("Selected pairing")
            show_product_card(compared_item)

        score_col1, score_col2 = st.columns([0.35, 0.65])
        with score_col1:
            st.metric("Compatibility", f"{pair_analysis['compatibility_score']:.0f}%")
        with score_col2:
            st.info(pair_analysis["style_reason"])

elif demo_mode == "My Closet":
    st.header("My Closet")
    st.markdown("*Upload a photo, then choose what type of item it is. We'll use the focal item and ignore background.*")

    uploaded_file = st.file_uploader(
        "Upload a closet image",
        type=["png", "jpg", "jpeg", "webp"],
        help="Try shoes, a handbag, pants, a jacket, jewelry, or any wardrobe piece.",
    )

    # When the uploaded file changes, reset item type so user must choose again for this image
    if uploaded_file is not None:
        file_id = (uploaded_file.name, len(uploaded_file.getvalue()))
        if st.session_state.get("closet_last_file_id") != file_id:
            st.session_state["closet_last_file_id"] = file_id
            st.session_state["closet_item_type"] = "— Select item type —"

    item_type_options = ["— Select item type —", "Top", "Pants", "Skirt", "Bottoms", "Dress", "Outerwear", "Bag", "Shoes", "Jewelry"]
    item_type_hint = st.selectbox(
        "What is this item?",
        item_type_options,
        key="closet_item_type",
        help="Pick the category for this upload so similar items and styling stay accurate. Resets when you upload a new image.",
    )
    with st.expander("Pants vs Bottoms?"):
        st.caption("**Bottoms** = pants, jeans, skirts, shorts (any lower-body piece). **Pants** = pants and jeans only; skirts are excluded. Use Pants when you want only trousers/jeans as similar or pairing results; use Bottoms when skirts are fine too.")

    closet_mode = st.radio(
        "Match mode",
        ["Closest AFLALO Match", "Style With It"],
        horizontal=True,
        help="Closest Match finds visually similar AFLALO pieces. Style With It finds AFLALO pieces that pair well with the uploaded item.",
    )

    if uploaded_file is not None and item_type_hint == "— Select item type —":
        st.warning("Please select an item type above (e.g. Pants, Top, Jewelry) before we analyze your upload.")

    if uploaded_file is not None and item_type_hint != "— Select item type —":
        uploaded_bytes = uploaded_file.getvalue()
        uploaded_image = Image.open(BytesIO(uploaded_bytes)).convert("RGB")
        state_key = f"closet-compare-{uploaded_file.name}-{len(uploaded_bytes)}-{closet_mode}"

        left_col, right_col = st.columns([0.95, 1.45])
        with left_col:
            st.subheader("Uploaded Piece")
            st.image(uploaded_image, width="stretch")
            st.caption(f"Item hint: {item_type_hint}")

        with right_col:
            st.subheader("AFLALO Results")
            spinner_msg = f"Analyzing '{uploaded_file.name}' as {item_type_hint} (focal extraction + CV + matching)..."
            with st.spinner(spinner_msg):
                if closet_mode == "Closest AFLALO Match":
                    matches = rec.find_uploaded_similar_items(uploaded_image, n=3, item_type_hint=item_type_hint)
                else:
                    matches = rec.style_uploaded_item(uploaded_image, n=3, item_type_hint=item_type_hint)

            if matches.empty:
                st.warning("No AFLALO matches were found for this uploaded image.")
                st.stop()

            result_cols = st.columns(max(len(matches), 1))
            for col, (_, item) in zip(result_cols, matches.iterrows()):
                with col:
                    show_product_card(item)
                    st.markdown(f"**{item['compatibility_score']:.0f}% Match**")
                    st.write(item["style_reason"])
                    st.button(
                        "Compare Side by Side",
                        key=f"{state_key}-{item['id']}",
                        on_click=set_uploaded_comparison_target,
                        args=(state_key, item["id"]),
                        width="stretch",
                    )

        selected_match_id = st.session_state.get(state_key, int(matches.iloc[0]["id"]))
        compared_item = matches[matches["id"] == selected_match_id]
        if compared_item.empty:
            compared_item = products[products["id"] == selected_match_id]
        compared_item = compared_item.iloc[0]

        st.markdown("---")
        st.subheader("Side-by-Side Review")
        compare_col1, compare_col2 = st.columns(2)
        with compare_col1:
            st.caption("Your uploaded piece")
            st.image(uploaded_image, width="stretch")
        with compare_col2:
            st.caption("Mapped AFLALO result")
            show_product_card(compared_item)

        score_col1, score_col2 = st.columns([0.35, 0.65])
        with score_col1:
            try:
                score_val = compared_item["compatibility_score"] if "compatibility_score" in compared_item else None
            except (KeyError, TypeError):
                score_val = None
            if score_val is not None:
                st.metric("Match Score", f"{float(score_val):.0f}%")
            else:
                st.metric("Match Score", "—")
        with score_col2:
            try:
                reason = compared_item["style_reason"] if "style_reason" in compared_item else None
            except (KeyError, TypeError):
                reason = None
            st.info(str(reason) if reason is not None else "Reasoning not available for this selection.")

        # REMOVED: "Build a Look From This Match" section
        # This feature was redundant with "Style With It" mode and caused UX confusion
        # Users upload THEIR jacket → Want to see what pairs with THEIR jacket
        # Not what pairs with a different AFLALO jacket that happens to look similar

elif demo_mode == "Live Try-On":
    st.header("Live Try-On")
    st.markdown("*Launch your camera, preview an AFLALO item as a live overlay, then snap a photo after a 5-second timer.*")

    # Default to python/snake jacket; move Alere Top in Silk to bottom of list
    tryon_default = "Mentra Jacket in Python Embossed Leather"
    tryon_move_to_end = "Alere Top in Silk"
    names = products["name"].tolist()
    tryon_names = [n for n in names if n == tryon_default]
    tryon_names += [n for n in names if n != tryon_default and n != tryon_move_to_end]
    tryon_names += [n for n in names if n == tryon_move_to_end]
    tryon_default_index = 0 if tryon_default in tryon_names else 0
    selected_product = st.selectbox(
        "Select a product to preview:",
        tryon_names,
        index=tryon_default_index,
        key="tryon-product",
    )
    product_id = _product_id_for_name(products, selected_product)
    selected = products[products["id"] == product_id].iloc[0]

    with st.spinner("Preparing the product overlay asset..."):
        overlay_data_url = build_overlay_asset(selected.get("image_url"))

    setup_col1, setup_col2 = st.columns([0.8, 1.2])
    with setup_col1:
        st.subheader("Selected Item")
        show_product_card(selected)
        st.caption(
            "Best for a prototype: bags, jewelry, sunglasses, outerwear, and front-facing garments. "
            "This is a live 2D overlay preview rather than full garment warping."
        )
    with setup_col2:
        st.subheader("Live Camera Preview")
        defaults = overlay_defaults(selected.get("category", ""))
        render_live_try_on_component(
            overlay_data_url,
            defaults,
            component_key=f"tryon-{product_id}",
        )

elif demo_mode == "Size Prediction":
    st.header("AI Size Recommendation")
    st.markdown("*Garment-specific sizing powered by body-to-garment measurement matching, fit intent, and confidence scoring.*")

    selected_product = st.selectbox(
        "Select a product to size:",
        products["name"].tolist(),
        key="size-product",
    )
    product_id = _product_id_for_name(products, selected_product)
    selected = products[products["id"] == product_id].iloc[0]

    # Show sizes from aflalonyc.com when available
    available_sizes = selected["sizes"] if "sizes" in products.columns else None
    if available_sizes is not None and str(available_sizes).strip() and str(available_sizes) != "nan":
        size_list = ", ".join(s.strip() for s in str(available_sizes).split(",") if s.strip())
        st.caption(f"**Sizes for this item (from [aflalonyc.com](https://aflalonyc.com)):** {size_list}")

    col1, col2 = st.columns([0.9, 1.1])
    with col1:
        st.subheader("Selected Garment")
        show_product_card(selected)

    with col2:
        st.subheader("Your Measurements")
        st.caption("Enter measurements in inches.")
        measure_col1, measure_col2 = st.columns(2)
        with measure_col1:
            bust = st.number_input("Bust", min_value=28.0, max_value=50.0, value=34.0, step=0.5)
            waist = st.number_input("Waist", min_value=22.0, max_value=45.0, value=26.5, step=0.5)
            hip = st.number_input("Hip", min_value=32.0, max_value=55.0, value=37.0, step=0.5)
        with measure_col2:
            inseam = st.number_input("Inseam", min_value=26.0, max_value=36.0, value=31.0, step=0.5)
            height = st.number_input("Height", min_value=58.0, max_value=74.0, value=66.0, step=1.0, help="Height in inches.")
            fit_preference = st.selectbox(
                "Fit preference",
                ["Closer fit", "True to size", "Relaxed fit"],
            )

        prediction = rec.predict_size_fit(
            product_id,
            {
                "bust": bust,
                "waist": waist,
                "hip": hip,
                "inseam": inseam,
                "height": height,
            },
            fit_preference=fit_preference,
        )

        metric_col1, metric_col2 = st.columns(2)
        with metric_col1:
            st.metric("Recommended Size", prediction["recommended_size"])
        with metric_col2:
            st.metric("Confidence", f"{prediction['confidence']*100:.0f}%")

        # Prominent rationale box
        st.markdown("### Why This Size?")
        st.info(prediction["reason"])
        
        # Add methodology transparency
        with st.expander("How sizing works"):
            st.markdown("""
            **Methodology:**
            
            This prototype uses industry-standard body measurement tables combined with AI-detected garment characteristics:
            
            1. **Garment Analysis**: Reads product description to detect silhouette (relaxed, fitted, structured), material (silk, denim, wool), and stretch properties
            2. **Ease Calculation**: Applies category-specific ease rules (e.g., jackets need 4-6" ease, fitted dresses need 1-2" ease)
            3. **Body Matching**: Compares your measurements against each size's garment measurements
            4. **Fit Preference**: Adjusts recommendations based on your preference (closer fit vs relaxed)
            
            **Note:** Size options (e.g. XS, S, M, L) are pulled from aflalonyc.com per product; body measurement tables are standard. If AFLALO adds size charts via the API, we can use those next.
            """)

        detail_col1, detail_col2, detail_col3 = st.columns(3)
        with detail_col1:
            st.caption(f"Category: {prediction['category']}")
        with detail_col2:
            st.caption(f"Silhouette: {prediction['silhouette']}")
        with detail_col3:
            st.caption(f"Fit intent: {prediction['fit_intent']}")

        with st.expander("Why this size was chosen"):
            ranked_scores = pd.DataFrame(
                [
                    {"size": row["size"], "score": row["score"]}
                    for row in prediction["size_scores"]
                ]
            )
            st.dataframe(ranked_scores, width="stretch", hide_index=True)

        with st.expander("Estimated garment measurements by size"):
            st.dataframe(prediction["size_chart"], width="stretch", hide_index=True)

# System Architecture
st.sidebar.markdown("---")
st.sidebar.header("System Architecture")
with st.sidebar.expander("Data Flow"):
    st.write("""
    **Shopify** → Product catalog, inventory (live)
    **NetSuite** → Purchase history, returns
    **Klaviyo** → Customer segments
    **AI Layer** → Recommendations, predictions
    """)
with st.sidebar.expander("Current Integrations"):
    st.write("✅ Shopify API (products from aflalonyc.com)")
    st.write("✅ Product images & descriptions")
    st.write("✅ Synthetic purchase data")
    st.write("⏳ NetSuite (next: return data)")
    st.write("⏳ Klaviyo (next: email triggers)")

# Footer
st.sidebar.markdown("---")
st.sidebar.markdown("**Built by Parker Case**")
st.sidebar.markdown("Founding AI Engineer Demo")
st.sidebar.markdown(f"Products: {len(products)}")
