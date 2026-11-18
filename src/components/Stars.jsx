import { StarIcon } from "./Icons.jsx";
import "./Stars.css";

// Five stars filled up to `mark`, also partly: 4.5 = four full stars and a half one.
// Each star is a grey star with a coloured copy on top, cut to the right width.
// Read out as "4.5 out of 5 stars".
export default function Stars({ mark, className = "" }) {
  return (
    <span className={`stars ${className}`} role="img" aria-label={`${mark} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.min(Math.max(mark - (n - 1), 0), 1); // 0 = empty, 1 = full
        return (
          <span key={n} className="stars__star">
            <StarIcon className="stars__empty" />
            {fill > 0 && (
              <span className="stars__fill" style={{ width: `${fill * 100}%` }}>
                <StarIcon />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
