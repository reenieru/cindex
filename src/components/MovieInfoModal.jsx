import { useEffect, useRef, useState } from "react";
import {
  formatRuntime,
  getMovieGenres,
  getMtrcbRatingClass,
  getReleaseYear,
  getTrailerSource,
} from "./movieUtils";
import "./MovieInfoModal.css";

const formatFieldName = (field) =>
  field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

function MovieValue({ value }) {
  if (value === null) {
    return <span className="movie-info-empty">None</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="movie-info-empty">None</span>;
    }

    return (
      <ul className="movie-info-list">
        {value.map((item, index) => (
          <li key={`${index}-${String(item)}`}>
            {typeof item === "object" && item !== null ? (
              <dl className="movie-info-nested">
                {Object.entries(item).map(([field, nestedValue]) => (
                  <div key={field}>
                    <dt>{formatFieldName(field)}</dt>
                    <dd>
                      <MovieValue value={nestedValue} />
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length ? (
      <dl className="movie-info-nested">
        {entries.map(([field, nestedValue]) => (
          <div key={field}>
            <dt>{formatFieldName(field)}</dt>
            <dd>
              <MovieValue value={nestedValue} />
            </dd>
          </div>
        ))}
      </dl>
    ) : (
      <span className="movie-info-empty">None</span>
    );
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function MovieInfoModal({
  movie,
  movies,
  slideDirection,
  onMovieChange,
  onClose,
  onEdit,
  onDelete,
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const dialogRef = useRef(null);

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.scrollTop = 0;
    }
  }, [movie.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDelete = async () => {
    const movieTitle = movie.title || "this movie";
    if (
      !window.confirm(
        `Delete "${movieTitle}"? This permanently removes the movie and all of its information.`,
      )
    ) {
      return;
    }

    setDeleteError("");
    setIsDeleting(true);
    try {
      await onDelete(movie);
    } catch (error) {
      setDeleteError(
        `Could not delete movie: ${error.message || "Unknown Firestore error"}`,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const featuredFields = new Set([
    "id",
    "title",
    "genre",
    "genres",
    "ReleaseYear",
    "runtime",
    "mtrcb_rating",
    "average_rating",
    "ReceivedOscar",
    "director",
    "description",
    "poster_url",
    "backdrop_url",
    "trailer_url",
  ]);
  const additionalFields = Object.entries(movie).filter(
    ([field]) => !featuredFields.has(field),
  );
  const posterUrl = movie.poster_url || movie.backdrop_url;
  const genres = getMovieGenres(movie);
  const trailerSource = getTrailerSource(movie.trailer_url);
  const currentMovieIndex = movies.findIndex(
    (currentMovie) => currentMovie.id === movie.id,
  );
  const previousMovie =
    movies[(currentMovieIndex - 1 + movies.length) % movies.length];
  const nextMovie = movies[(currentMovieIndex + 1) % movies.length];

  const handleMovieChange = (nextMovie, direction) => {
    setIsDescriptionExpanded(false);
    setDeleteError("");
    onMovieChange(nextMovie, direction);
  };

  return (
    <div
      className="movie-info-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="movie-info-layout">
        <section
          key={movie.id}
          className={`movie-info-dialog movie-info-dialog-${slideDirection}`}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="movie-info-title"
        >
        <div
          className="movie-info-poster"
          style={
            posterUrl
              ? { backgroundImage: `url("${posterUrl.replaceAll('"', '\\"')}")` }
              : undefined
          }
          role="img"
          aria-label={movie.title ? `${movie.title} poster` : "Movie poster"}
        >
          <div className="movie-info-poster-shade" />
          <button
            className="movie-info-close"
            type="button"
            aria-label="Close movie information"
            onClick={onClose}
          >
            ×
          </button>
          <div className="movie-info-hero-content">
            <header className="movie-info-header">
              <div className="movie-info-title-group">
                <h2 id="movie-info-title">
                  {movie.title || "Movie Information"}
                </h2>
                <p className="movie-info-genres" aria-label="Genres">
                  {genres.length > 0
                    ? genres.map((genre, index) => (
                        <span
                          className="movie-info-genre"
                          key={`${genre}-${index}`}
                        >
                          {index > 0 && (
                            <span
                              className="movie-info-genre-separator"
                              aria-hidden="true"
                            >
                              •
                            </span>
                          )}
                          {genre}
                        </span>
                      ))
                    : "Genre unavailable"}
                </p>
              </div>
            </header>
            <div className="movie-info-meta">
              <span>
                {getReleaseYear(movie.ReleaseYear) || "Year unavailable"}
              </span>
              <span>
                {movie.runtime != null
                  ? formatRuntime(movie.runtime)
                  : "Runtime unavailable"}
              </span>
              <span
                className={`movie-info-mtrcb movie-info-mtrcb-${getMtrcbRatingClass(movie.mtrcb_rating)}`}
              >
                {movie.mtrcb_rating || "Not Rated"}
              </span>
              <span className="movie-info-score">
                ★{" "}
                {movie.average_rating != null
                  ? movie.average_rating
                  : "Not rated"}
              </span>
            </div>
            {movie.director && (
              <p className="movie-info-director">
                Director: <strong>{movie.director}</strong>
              </p>
            )}
            {movie.description && (
              <div className="movie-info-overview">
                <p
                  className={
                    isDescriptionExpanded
                      ? ""
                      : "movie-info-description-clamped"
                  }
                >
                  {movie.description}
                </p>
                {movie.description.length > 160 && (
                  <button
                    className="movie-info-read-more"
                    type="button"
                    aria-expanded={isDescriptionExpanded}
                    onClick={() =>
                      setIsDescriptionExpanded((expanded) => !expanded)
                    }
                  >
                    {isDescriptionExpanded ? "Read Less" : "Read More"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="movie-info-content" key={movie.id}>
          {trailerSource && (
            <section className="movie-info-media-section">
              <h3>Trailer</h3>
              {trailerSource.type === "embed" ? (
                <iframe
                  className="movie-info-trailer"
                  src={trailerSource.src}
                  title={`${movie.title || "Movie"} trailer`}
                  allow="encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <video
                  className="movie-info-trailer"
                  src={trailerSource.src}
                  controls
                  playsInline
                />
              )}
            </section>
          )}
          {movie.backdrop_url && (
            <section className="movie-info-media-section">
              <h3>Background Poster</h3>
              <img
                className="movie-info-backdrop-poster"
                src={movie.backdrop_url}
                alt={`${movie.title || "Movie"} background poster`}
                loading="lazy"
              />
            </section>
          )}
          <section className="movie-info-additional">
            <h3>Awards</h3>
            <dl className="movie-info-fields">
              <div
                className={`movie-info-field${movie.ReceivedOscar === true ? " movie-info-field-oscar" : ""}`}
              >
                <dt>Received Oscar</dt>
                <dd>{movie.ReceivedOscar === true ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </section>
          {additionalFields.length > 0 && (
            <section className="movie-info-additional">
              <h3>More Information</h3>
              <dl className="movie-info-fields">
                {additionalFields.map(([field, value]) => (
                  <div className="movie-info-field" key={field}>
                    <dt>{formatFieldName(field)}</dt>
                    <dd>
                      <MovieValue value={value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <div className="movie-info-management">
            <button
              className="movie-info-edit"
              type="button"
              onClick={() => onEdit(movie)}
            >
              Edit Movie
            </button>
            <button
              className="movie-info-delete"
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete Movie"}
            </button>
          </div>
          {deleteError && (
            <p className="movie-info-delete-error" role="alert">
              {deleteError}
            </p>
          )}
        </div>
        </section>
        {movies.length > 1 && (
          <>
            <div className="movie-info-nav-control movie-info-nav-previous">
              <button
                className="movie-info-nav-button"
                type="button"
                aria-label={`Previous movie: ${previousMovie.title || "Untitled movie"}`}
                disabled={isDeleting}
                onClick={() => handleMovieChange(previousMovie, "previous")}
              >
                &lt;
              </button>
              <div className="movie-info-nav-preview" aria-hidden="true">
                {(previousMovie.backdrop_url || previousMovie.poster_url) && (
                  <img
                    src={previousMovie.backdrop_url || previousMovie.poster_url}
                    alt=""
                  />
                )}
                <span>{previousMovie.title || "Untitled movie"}</span>
              </div>
            </div>
            <div className="movie-info-nav-control movie-info-nav-next">
              <button
                className="movie-info-nav-button"
                type="button"
                aria-label={`Next movie: ${nextMovie.title || "Untitled movie"}`}
                disabled={isDeleting}
                onClick={() => handleMovieChange(nextMovie, "next")}
              >
                &gt;
              </button>
              <div className="movie-info-nav-preview" aria-hidden="true">
                {(nextMovie.backdrop_url || nextMovie.poster_url) && (
                  <img
                    src={nextMovie.backdrop_url || nextMovie.poster_url}
                    alt=""
                  />
                )}
                <span>{nextMovie.title || "Untitled movie"}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MovieInfoModal;
