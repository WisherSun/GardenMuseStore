import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "../../components/Icons.jsx";
import "./StudioFilm.css";

// PLACEHOLDER video: "A florist making flower arrangement" from Pexels
// (https://www.pexels.com/video/a-florist-making-flower-arrangement-3805783/), free to use
// without credit. It is kept in public/video/ so it doesn't depend on Pexels staying online.
// Replace it (and the poster = the still shown until the video plays) with the studio's own film.
const VIDEO_SRC = "/video/studio-film-720.mp4";
const POSTER_SRC = "/video/studio-film-poster.jpg";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Home page: a short silent film from the studio that plays in a loop by itself.
// - It only starts (and only downloads) when it scrolls into view, and pauses when it
//   leaves the screen, so it doesn't use mobile data or battery for nothing.
// - Muted: browsers only allow videos to play by themselves without sound.
// - The small button in the corner pauses it. Accessibility rules ask for this for anything
//   that moves for longer than 5 seconds.
// - People who asked their device for less motion see the still photo until they press play.
export default function StudioFilm() {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(prefersReducedMotion); // paused by the visitor (or by the setting)
  const [inView, setInView] = useState(false);

  // Is the video on the screen?
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Play while on screen and not paused, otherwise pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView && !paused) {
      video.play().catch(() => {
        // The browser refused (e.g. battery saver): show the play button instead
        setPaused(true);
      });
    } else {
      video.pause();
    }
  }, [inView, paused]);

  return (
    <section className="section studio-film" aria-labelledby="studio-film-title">
      <div className="container">
        <div className="studio-film__text">
          <span className="eyebrow">Inside the studio</span>
          <h2 id="studio-film-title" className="studio-film__title">
            Watch a bouquet come to life
          </h2>
          <p className="studio-film__desc">
            Every stem is chosen, trimmed and placed by hand. Spend a minute at the table with our
            florists.
          </p>
        </div>

        <div className="studio-film__frame">
          <video
            ref={videoRef}
            className="studio-film__video"
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            preload="none" // nothing is downloaded until it is about to play
            muted
            loop
            playsInline // iPhones: play on the page, not in full screen
            disablePictureInPicture
            width="1280"
            height="720"
            aria-label="Silent film: a florist arranging a bouquet in the Garden Muse studio"
          />
          <button
            type="button"
            className="studio-film__toggle"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play the film" : "Pause the film"}
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </button>
        </div>
      </div>
    </section>
  );
}
