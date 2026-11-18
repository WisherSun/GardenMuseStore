import { useRef, useState } from "react";
import { PlayIcon } from "../../components/Icons.jsx";
import "./StudioFilm.css";

// PLACEHOLDER video: "A florist making flower arrangement" from Pexels
// (https://www.pexels.com/video/a-florist-making-flower-arrangement-3805783/), free to use
// without credit. It is kept in public/video/ so it doesn't depend on Pexels staying online.
// Replace it (and the poster = the still shown before playing) with the studio's own film.
const VIDEO_SRC = "/video/studio-film-720.mp4";
const POSTER_SRC = "/video/studio-film-poster.jpg";

// Home page: a short film from the studio. Before it is played, only the still photo is
// loaded (preload="none"), so the video doesn't use anyone's mobile data until they ask for it.
// After "Play", the browser's own controls appear (pause, sound, full screen).
export default function StudioFilm() {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);

  const play = () => {
    setStarted(true);
    videoRef.current?.play().catch(() => {
      // Some browsers refuse; the controls are shown anyway, so the visitor can press play there.
    });
  };

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

        <div className={`studio-film__frame ${started ? "is-playing" : ""}`}>
          <video
            ref={videoRef}
            className="studio-film__video"
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            preload="none"
            playsInline // iPhones: play on the page, not straight to full screen
            controls={started}
            width="1280"
            height="720"
            aria-label="Film: a florist arranging a bouquet in the Garden Muse studio"
          />
          {!started && (
            <button type="button" className="studio-film__play" onClick={play}>
              <span className="studio-film__play-circle">
                <PlayIcon className="studio-film__play-icon" />
              </span>
              <span className="studio-film__play-label">Play the film</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
