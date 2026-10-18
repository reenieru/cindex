import { getReleaseYear } from "./movieUtils";

function MovieCard({
  movie,
  isFeatured,
  onFeature,
  onShowInfo,
}) {
  return (
    <article
      className={`movie-choice${isFeatured ? " movie-choice-active" : ""}`}
    >
      <div className="movie-choice-artwork">
        <button
          className="movie-choice-poster"
          type="button"
          onClick={() => onFeature(movie.id)}
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
            onClick={() => onShowInfo(movie)}
          >
            i
          </button>
          <div className="movie-choice-meta">
            <span>{getReleaseYear(movie.release_date) || "Year N/A"}</span>
            <span>
              {movie.average_rating != null
                ? `★ ${movie.average_rating}`
                : "Rating N/A"}
            </span>
          </div>
        </div>
      </div>
      <span>{movie.title || "Untitled movie"}</span>
    </article>
  );
}

export default MovieCard;
