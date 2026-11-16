import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRightIcon, CloseIcon, SearchIcon } from "../../components/Icons.jsx";

const ZOOM = 2.5; // how much bigger the photo gets when zoomed in
const SWIPE = 50; // px a finger has to move sideways to go to the next photo
const TAP = 6; // px: moving less than this still counts as a click/tap, not a drag

// Full-screen photo viewer for the product page.
// - Click / tap the photo: zoom in on that spot. Again: zoom back out.
// - Zoomed in: drag with the mouse, or move with a finger / trackpad, to look around.
// - Arrows, ← → keys, or a sideways swipe: next / previous photo.
// - Esc, the × button, or a click on the dark area: close.
// On phones, pinching with two fingers also works (the browser's own zoom).
// `onClose(index)` gets the photo that was showing, so the page can show the same one.
export default function ImageViewer({ images, name, startIndex = 0, onClose }) {
  const dialogRef = useRef(null);
  const stageRef = useRef(null);
  const pointer = useRef(null); // where the current click / drag / swipe started
  const pendingScroll = useRef(null); // the spot to keep under the cursor after zooming in
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(null); // null = whole photo fits; { width, height } = zoomed size
  const many = images.length > 1;

  // <dialog> gives a focus trap and Esc for free. The page behind must not scroll meanwhile.
  useEffect(() => {
    const dialog = dialogRef.current;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    dialog.showModal();
    root.style.overflow = "hidden";
    return () => {
      dialog.close();
      root.style.overflow = previousOverflow;
    };
  }, []);

  const close = () => onClose(index);

  const show = (i) => {
    setIndex((i + images.length) % images.length); // after the last photo comes the first
    setZoom(null);
  };

  // Zooms in so the point under the cursor (or finger) stays where it is
  const zoomAt = (clientX, clientY) => {
    const stage = stageRef.current;
    const img = stage?.querySelector("img");
    if (!img) return;
    const photo = img.getBoundingClientRect();
    const box = stage.getBoundingClientRect();
    const clamp = (n) => Math.min(Math.max(n, 0), 1);
    pendingScroll.current = {
      fx: clamp((clientX - photo.left) / photo.width), // 0 = left edge of the photo, 1 = right edge
      fy: clamp((clientY - photo.top) / photo.height),
      x: clientX - box.left,
      y: clientY - box.top,
    };
    setZoom({ width: photo.width * ZOOM, height: photo.height * ZOOM });
  };

  const zoomFromCenter = () => {
    const photo = stageRef.current?.querySelector("img")?.getBoundingClientRect();
    if (photo) zoomAt(photo.left + photo.width / 2, photo.top + photo.height / 2);
  };

  // Runs after the bigger photo is on screen, before it's painted: scroll to the chosen spot
  useLayoutEffect(() => {
    const spot = pendingScroll.current;
    const stage = stageRef.current;
    if (!zoom || !spot || !stage) return;
    stage.scrollLeft = spot.fx * zoom.width - spot.x;
    stage.scrollTop = spot.fy * zoom.height - spot.y;
    pendingScroll.current = null;
  }, [zoom]);

  // One set of handlers for mouse, finger and pen ("pointer events")
  const handlePointerDown = (e) => {
    const stage = stageRef.current;
    pointer.current = {
      type: e.pointerType,
      onPhoto: e.target.tagName === "IMG",
      x: e.clientX,
      y: e.clientY,
      left: stage.scrollLeft,
      top: stage.scrollTop,
    };
    // Mouse drag while zoomed: keep getting the moves even if the cursor leaves the photo
    if (zoom && e.pointerType === "mouse") stage.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const start = pointer.current;
    if (!start || !zoom || start.type !== "mouse") return;
    const stage = stageRef.current;
    stage.scrollLeft = start.left - (e.clientX - start.x);
    stage.scrollTop = start.top - (e.clientY - start.y);
  };

  const handlePointerUp = (e) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const moved = Math.abs(dx) > TAP || Math.abs(dy) > TAP;

    if (!moved) {
      if (zoom) setZoom(null);
      else if (start.onPhoto) zoomAt(e.clientX, e.clientY);
      else close(); // click on the dark area around the photo
      return;
    }

    // Finger swipe sideways (not zoomed): next / previous photo
    if (!zoom && many && start.type !== "mouse" && Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
      show(index + (dx < 0 ? 1 : -1));
    }
  };

  const handleKeyDown = (e) => {
    if (!many) return;
    if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "ArrowLeft") show(index - 1);
  };

  return (
    <dialog
      ref={dialogRef}
      className="viewer"
      aria-label={`${name} photos`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="viewer__bar">
        <span className="viewer__count" aria-live="polite">
          {many && `${index + 1} / ${images.length}`}
        </span>
        <div className="viewer__tools">
          <button
            type="button"
            className="viewer__btn"
            onClick={() => (zoom ? setZoom(null) : zoomFromCenter())}
            aria-pressed={Boolean(zoom)}
            aria-label={zoom ? "Zoom out" : "Zoom in"}
          >
            <SearchIcon />
          </button>
          <button type="button" className="viewer__btn" onClick={close} aria-label="Close" autoFocus>
            <CloseIcon />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={`viewer__stage ${zoom ? "is-zoomed" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => (pointer.current = null)} // the browser took over (scroll / pinch)
      >
        <img
          key={images[index]}
          src={images[index]}
          alt={`${name}, photo ${index + 1} of ${images.length}`}
          draggable="false"
          style={zoom ? { width: zoom.width, height: zoom.height } : undefined}
        />
      </div>

      {many && !zoom && (
        <>
          <button
            type="button"
            className="viewer__arrow viewer__arrow--prev"
            onClick={() => show(index - 1)}
            aria-label="Previous photo"
          >
            <ArrowRightIcon />
          </button>
          <button
            type="button"
            className="viewer__arrow viewer__arrow--next"
            onClick={() => show(index + 1)}
            aria-label="Next photo"
          >
            <ArrowRightIcon />
          </button>
        </>
      )}
    </dialog>
  );
}
