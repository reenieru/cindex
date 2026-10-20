import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getReleaseYear } from "./movieUtils";
import {
  useMovieCardAnimationEnd,
  useMovieCardTilt,
} from "../animations/animationHooks";

function MovieCardFace({
  movie,
  bayNumber,
  isFeatured,
  isExpanded,
  isClosing,
  onFeature,
  onExpand,
  onCloseExpanded,
  onCloseAnimationEnd,
  onShowInfo,
}) {
  const closeButtonRef = useRef(null);
  const pointerHandlers = useMovieCardTilt();
  const handleAnimationEnd = useMovieCardAnimationEnd(
    isExpanded,
    isClosing,
    onCloseAnimationEnd,
  );

  useEffect(() => {
    if (isExpanded) {
      closeButtonRef.current?.focus();
    }
  }, [isExpanded]);

  return (
    <article
      className={`movie-choice${isFeatured ? " movie-choice-active" : ""}${isExpanded ? " movie-choice-expanded" : ""}${isClosing ? " movie-choice-closing" : ""}`}
      role={isExpanded ? "dialog" : undefined}
      aria-modal={isExpanded ? "true" : undefined}
      aria-label={isExpanded ? movie.title || "Movie details" : undefined}
      onAnimationEnd={handleAnimationEnd}
      onClick={(event) => {
        if (!event.target.closest("button")) {
          onExpand(movie.id);
        }
      }}
      {...pointerHandlers}
    >
      {isExpanded && (
        <button
          ref={closeButtonRef}
          className="movie-choice-close"
          type="button"
          onClick={onCloseExpanded}
        >
          Close
        </button>
      )}
      <div className="movie-choice-artwork">
        <button
          className="movie-choice-poster"
          type="button"
          onClick={() => {
            onFeature(movie.id);
            onExpand(movie.id);
          }}
          aria-label={`Feature ${movie.title || "Untitled movie"}`}
        >
          {movie.poster_url ? (
            <img src={movie.poster_url} alt="" loading="lazy" />
          ) : (
            <span className="movie-choice-placeholder">No poster</span>
          )}
        </button>
        <div className="movie-choice-overlay">
          <button
            className="movie-choice-info"
            type="button"
            aria-label={`View information for ${movie.title || "Untitled movie"}`}
            onClick={() => onShowInfo(movie, isExpanded)}
          >
            i
          </button>
          <div className="movie-choice-meta">
            <span>{getReleaseYear(movie.ReleaseYear) || "Year N/A"}</span>
            <span>
              {movie.average_rating != null
                ? `★ ${movie.average_rating}`
                : "Rating N/A"}
            </span>
          </div>
        </div>
      </div>
      <div className="movie-choice-charge" aria-hidden="true">
        <span>CHG</span>
        <span className="movie-choice-charge-track">
          <span />
        </span>
        <span>78%</span>
      </div>
      <div className="movie-choice-label" aria-hidden="true">
        <span>BAY {String(bayNumber).padStart(2, "0")}</span>
        <span>CHARGING</span>
      </div>
      <span className="movie-choice-title">
        {movie.title || "Untitled movie"}
      </span>
    </article>
  );
}

function MovieCard({
  movie,
  bayNumber,
  isFeatured,
  isExpanded,
  isClosing,
  onFeature,
  onExpand,
  onCloseExpanded,
  onCloseAnimationEnd,
  onShowInfo,
}) {
  const cardProps = {
    movie,
    bayNumber,
    isFeatured,
    onFeature,
    onExpand,
    onCloseExpanded,
    onCloseAnimationEnd,
    onShowInfo,
  };

  return (
    <>
      <div
        className={`movie-choice-slot${isExpanded ? " movie-choice-slot-expanded" : ""}`}
        aria-hidden={isExpanded || undefined}
      >
        <MovieCardFace {...cardProps} />
      </div>
      {isExpanded &&
        createPortal(
          <div
            className={`movie-card-modal${isClosing ? " movie-card-modal-closing" : ""}`}
          >
            <button
              className="movie-card-modal-backdrop"
              type="button"
              aria-label="Close expanded movie card"
              onClick={onCloseExpanded}
            />
            <MovieCardFace
              {...cardProps}
              isExpanded
              isClosing={isClosing}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

export default MovieCard;
