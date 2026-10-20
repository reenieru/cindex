import { useState } from "react";
import { useFeaturedMovieAnimation } from "../animations/animationHooks";
import {
  formatRuntime,
  getMovieGenres,
  getMtrcbRatingClass,
  getReleaseYear,
  getTrailerSource,
} from "./movieUtils";

function FeaturedMovieCarousel({ movies, featuredMovieId, onFeatureMovie }) {
  const [movieInfoSelection, setMovieInfoSelection] = useState(null);

  const featuredMovie =
    movies.find((movie) => movie.id === featuredMovieId) ?? movies[0];
  const currentFeaturedMovieId = featuredMovie?.id;
  const showTrailer = useFeaturedMovieAnimation({
    currentFeaturedMovieId,
    featuredMovie,
    movies,
    onFeatureMovie,
  });

  if (!featuredMovie) {
    return null;
  }

  const trailerSource = getTrailerSource(featuredMovie.trailer_url, true);
  const showMovieInfo = movieInfoSelection === featuredMovie.id;
  const genres = getMovieGenres(featuredMovie);
  const heroImage = featuredMovie.backdrop_url || featuredMovie.poster_url;

  return (
    <section
      className="featured-hero"
      id="home"
      aria-labelledby="featured-title"
    >
      <div className="hero-trailer" aria-hidden="true">
        {showTrailer && trailerSource?.type === "embed" && (
          <iframe
            key={featuredMovie.id}
            src={trailerSource.src}
            title={`${featuredMovie.title || "Featured movie"} trailer`}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="eager"
            style={{ pointerEvents: "none" }}
            tabIndex={-1}
          />
        )}
        {showTrailer && trailerSource?.type === "video" && (
          <video
            key={featuredMovie.id}
            src={trailerSource.src}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload noplaybackrate noremoteplayback"
            style={{ pointerEvents: "none" }}
            tabIndex={-1}
          />
        )}
      </div>

      {heroImage && (
        <img
          key={`poster-${featuredMovie.id}`}
          className={`hero-poster${showTrailer && trailerSource ? " hero-poster-fade" : ""}`}
          src={heroImage}
          alt=""
          aria-hidden="true"
        />
      )}
      <div className="hero-shade" />

      {movies.length > 1 && (
        <div className="hero-pagination" aria-label="Featured movie selection">
          {movies.map((movie, index) => (
            <button
              key={movie.id}
              className={`hero-dot${movie.id === featuredMovie.id ? " hero-dot-active" : ""}`}
              type="button"
              aria-label={`Show ${movie.title || `movie ${index + 1}`}`}
              aria-current={movie.id === featuredMovie.id ? "true" : undefined}
              onClick={() => onFeatureMovie(movie.id)}
            />
          ))}
        </div>
      )}

      <div className="hero-content" key={`content-${featuredMovie.id}`}>
        <h1 id="featured-title" className="hero-title">
          {featuredMovie.title || "Untitled movie"}
        </h1>
        {genres.length > 0 && (
          <p className="hero-genres" aria-label="Genres">
            {genres.map((genre, index) => (
              <span key={`${genre}-${index}`}>
                {index > 0 && (
                  <span className="hero-genre-separator" aria-hidden="true">
                    •
                  </span>
                )}
                {genre}
              </span>
            ))}
          </p>
        )}
        <div className="hero-meta">
          {getReleaseYear(featuredMovie.ReleaseYear) && (
            <span className="hero-year">
              {getReleaseYear(featuredMovie.ReleaseYear)}
            </span>
          )}
          <span
            className={`hero-mtrcb-rating hero-mtrcb-rating-${getMtrcbRatingClass(featuredMovie.mtrcb_rating)}`}
          >
            {featuredMovie.mtrcb_rating || "Not Rated"}
          </span>
          {featuredMovie.ReceivedOscar === true && (
            <span className="hero-oscar-winner">Received Oscar</span>
          )}
          {featuredMovie.average_rating != null && (
            <span className="hero-rating">
              ★ {featuredMovie.average_rating}
            </span>
          )}
        </div>
        {featuredMovie.description && (
          <p className="hero-description">{featuredMovie.description}</p>
        )}
        {showMovieInfo && (
          <div className="hero-extra-info">
            {featuredMovie.runtime != null && (
              <span>{formatRuntime(featuredMovie.runtime)}</span>
            )}
            {featuredMovie.director && (
              <span>Directed by {featuredMovie.director}</span>
            )}
            {Array.isArray(featuredMovie.cast) &&
              featuredMovie.cast.length > 0 && (
                <span>
                  Starring{" "}
                  {featuredMovie.cast
                    .map((member) => member.actor_name)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
          </div>
        )}
        <div className="hero-actions">
          <button
            className="hero-info-button"
            type="button"
            onClick={() =>
              setMovieInfoSelection((current) =>
                current === featuredMovie.id ? null : featuredMovie.id,
              )
            }
            aria-expanded={showMovieInfo}
          >
            {showMovieInfo ? "Hide Information" : "View Information"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default FeaturedMovieCarousel;
