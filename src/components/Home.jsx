import { useCallback, useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import logoImg from "../assets/LogoWText.png";
import MovieForm from "./MovieForm";
import MovieCard from "./MovieCard";
import MovieInfoModal from "./MovieInfoModal";
import {
  getMovieGenres,
  getMtrcbRatingClass,
  getReleaseYear,
  getTrailerSource,
} from "./movieUtils";
import "./Homepage.css";

const copyrightYear = new Date().getFullYear();

function Home() {
  const [movies, setMovies] = useState([]);
  const [featuredMovieId, setFeaturedMovieId] = useState(null);
  const [revealedTrailerMovieId, setRevealedTrailerMovieId] = useState(null);
  const [savedMovieIds, setSavedMovieIds] = useState([]);
  const [showSavedMovies, setShowSavedMovies] = useState(false);
  const [showMovieInfo, setShowMovieInfo] = useState(false);
  const [movieInfoSelection, setMovieInfoSelection] = useState(null);
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieFormKey, setMovieFormKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [logoutError, setLogoutError] = useState("");

  const fetchMovies = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "movies"));
    return snapshot.docs.map((movieDocument) => ({
      id: movieDocument.id,
      ...movieDocument.data(),
    }));
  }, []);

  useEffect(() => {
    let isCurrent = true;

    fetchMovies()
      .then((loadedMovies) => {
        if (isCurrent) {
          setMovies(loadedMovies);
          setFeaturedMovieId(loadedMovies[0]?.id ?? null);
        }
      })
      .catch((error) => {
        console.error("Failed to load movies from Firestore.", error);
        if (isCurrent) {
          setLoadError({
            code: error.code || "unknown",
            message: error.message || "Unknown Firestore error",
          });
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [fetchMovies]);

  const handleRetry = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const loadedMovies = await fetchMovies();
      setMovies(loadedMovies);
      setFeaturedMovieId(loadedMovies[0]?.id ?? null);
    } catch (error) {
      console.error("Failed to load movies from Firestore.", error);
      setLoadError({
        code: error.code || "unknown",
        message: error.message || "Unknown Firestore error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!featuredMovieId) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => setRevealedTrailerMovieId(featuredMovieId),
      6500,
    );
    return () => window.clearTimeout(timer);
  }, [featuredMovieId]);

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to sign out.", error);
      setLogoutError("Could not sign out. Please try again.");
    }
  };

  const featuredMovie =
    movies.find((movie) => movie.id === featuredMovieId) ?? movies[0] ?? null;
  const trailerSource = getTrailerSource(featuredMovie?.trailer_url, true);
  const showTrailer = revealedTrailerMovieId === featuredMovie?.id;
  const genres = getMovieGenres(featuredMovie);
  const heroImage = featuredMovie?.backdrop_url || featuredMovie?.poster_url;
  const catalogueMovies = movies.filter((movie) => {
    const isSaved = savedMovieIds.includes(movie.id);
    return !showSavedMovies || isSaved;
  });
  const awardWinningMovies = movies.filter(
    (movie) => movie.hasOscar === true,
  );

  const handleFeatureMovie = (movieId) => {
    if (movieId !== featuredMovieId) {
      setRevealedTrailerMovieId(null);
      setShowMovieInfo(false);
      setFeaturedMovieId(movieId);
    }
  };

  const handleToggleSaved = (movieId) => {
    setSavedMovieIds((savedIds) =>
      savedIds.includes(movieId)
        ? savedIds.filter((id) => id !== movieId)
        : [...savedIds, movieId],
    );
  };

  const handleCloseMovieInfo = useCallback(() => {
    setMovieInfoSelection(null);
  }, []);

  const handleEditMovie = (movie) => {
    setMovieInfoSelection(null);
    setEditingMovie(movie);
    setMovieFormKey((key) => key + 1);
    setShowAddMovie(true);
  };

  const handleDeleteMovie = async (movie) => {
    try {
      await deleteDoc(doc(db, "movies", movie.id));
    } catch (error) {
      console.error("Failed to delete movie from Firestore.", error);
      throw error;
    }

    const remainingMovies = movies.filter(
      (currentMovie) => currentMovie.id !== movie.id,
    );
    setMovies(remainingMovies);
    setSavedMovieIds((savedIds) =>
      savedIds.filter((savedId) => savedId !== movie.id),
    );
    setFeaturedMovieId((currentId) =>
      currentId === movie.id ? remainingMovies[0]?.id ?? null : currentId,
    );
    setRevealedTrailerMovieId((currentId) =>
      currentId === movie.id ? null : currentId,
    );
    setMovieInfoSelection(null);
  };

  return (
    <main className="homepage">
      {isLoading ? (
        <section className="home-status">
          <p>Loading movies...</p>
        </section>
      ) : loadError ? (
        <section className="home-status" role="alert">
          <h1>Could not load movies</h1>
          <p>
            {loadError.code}: {loadError.message}
          </p>
          <button className="home-action" type="button" onClick={handleRetry}>
            Retry
          </button>
        </section>
      ) : (
        <>
          <nav className="home-nav" aria-label="Main navigation">
            <div className="home-brand">
              <img
                src={logoImg}
                alt="Cindex"
                className="home-logo"
                draggable={false}
              />
              <button className="home-logout" type="button" onClick={handleLogout}>
                Log Out
              </button>
            </div>
            <div className="home-nav-tools">
              <div className="home-nav-tabs">
                <a className="home-nav-link home-nav-link-active" href="#home">
                  <svg
                    className="home-nav-home-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
                  </svg>
                  Home
                </a>
                <a
                  className="home-nav-link"
                  href="#movies"
                  onClick={() => setShowSavedMovies(false)}
                >
                  Movies
                </a>
                <button
                  className={`home-nav-link${showSavedMovies ? " home-nav-link-active" : ""}`}
                  type="button"
                  onClick={() => setShowSavedMovies(!showSavedMovies)}
                >
                  My List
                </button>
                <button
                  className="home-nav-link home-add-movie"
                  type="button"
                  onClick={() => {
                    setEditingMovie(null);
                    setMovieFormKey((key) => key + 1);
                    setShowAddMovie(true);
                  }}
                >
                  + Add Movie
                </button>
              </div>
            </div>
          </nav>

          <MovieForm
            key={movieFormKey}
            isOpen={showAddMovie}
            movie={editingMovie}
            onClose={() => {
              setShowAddMovie(false);
              setEditingMovie(null);
            }}
            onMovieAdded={(movie) => {
              setMovies((currentMovies) => [...currentMovies, movie]);
              handleFeatureMovie(movie.id);
              setShowSavedMovies(false);
            }}
            onMovieUpdated={(updatedMovie) => {
              setMovies((currentMovies) =>
                currentMovies.map((currentMovie) =>
                  currentMovie.id === updatedMovie.id
                    ? updatedMovie
                    : currentMovie,
                ),
              );
            }}
          />
          {movieInfoSelection && (
            <MovieInfoModal
              movie={movieInfoSelection}
              onClose={handleCloseMovieInfo}
              onEdit={handleEditMovie}
              onDelete={handleDeleteMovie}
            />
          )}

          {logoutError && (
            <p className="home-error" role="alert">
              {logoutError}
            </p>
          )}

          {movies.length === 0 ? (
            <section className="home-status">
              <h1>No movies found</h1>
              <p>The movies collection is empty. Add a movie to get started.</p>
            </section>
          ) : (
            <>
          <section
            className="featured-hero"
            id="home"
            aria-labelledby="featured-title"
          >
            <div className="hero-trailer" aria-hidden="true">
              {showTrailer &&
                trailerSource?.type === "embed" && (
                  <iframe
                    key={featuredMovie.id}
                    src={trailerSource.src}
                    title={`${featuredMovie.title || "Featured movie"} trailer`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    tabIndex={-1}
                  />
                )}
              {showTrailer &&
                trailerSource?.type === "video" && (
                  <video
                    key={featuredMovie.id}
                    src={trailerSource.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    tabIndex={-1}
                  />
                )}
            </div>

            {heroImage && (
              <img
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
                    onClick={() => handleFeatureMovie(movie.id)}
                  />
                ))}
              </div>
            )}

            <div className="hero-content">
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
                {getReleaseYear(featuredMovie.release_date) && (
                  <span className="hero-year">
                    {getReleaseYear(featuredMovie.release_date)}
                  </span>
                )}
                <span
                  className={`hero-mtrcb-rating hero-mtrcb-rating-${getMtrcbRatingClass(featuredMovie.mtrcb_rating)}`}
                >
                  {featuredMovie.mtrcb_rating || "Not Rated"}
                </span>
                {featuredMovie.hasOscar === true && (
                  <span className="hero-oscar-winner">Oscar Winner</span>
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
                    <span>{featuredMovie.runtime} min</span>
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
                  onClick={() => setShowMovieInfo(!showMovieInfo)}
                  aria-expanded={showMovieInfo}
                >
                  {showMovieInfo ? "Hide Information" : "View Information"}
                </button>
                <div className="hero-utility-actions">
                  <button
                    className={`hero-utility-button${savedMovieIds.includes(featuredMovie.id) ? " hero-utility-active" : ""}`}
                    type="button"
                    onClick={() => handleToggleSaved(featuredMovie.id)}
                    aria-label={savedMovieIds.includes(featuredMovie.id) ? "Remove from My List" : "Add to My List"}
                    aria-pressed={savedMovieIds.includes(featuredMovie.id)}
                  >
                    {savedMovieIds.includes(featuredMovie.id) ? "✓" : "+"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            className="movie-catalogue"
            id="movies"
            aria-labelledby="catalogue-title"
          >
            <h2 id="catalogue-title">{showSavedMovies ? "My List" : "Movies"}</h2>
            {catalogueMovies.length > 0 ? (
              <div className="movie-list">
                {catalogueMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isFeatured={movie.id === featuredMovie.id}
                    onFeature={handleFeatureMovie}
                    onShowInfo={setMovieInfoSelection}
                    isSaved={savedMovieIds.includes(movie.id)}
                    onToggleSaved={handleToggleSaved}
                  />
                ))}
              </div>
            ) : (
              <p>
                {showSavedMovies
                  ? "No saved movies yet. Use the + button on a movie to add it."
                  : "No movies found."}
              </p>
            )}
          </section>

          <section
            className="movie-catalogue oscar-catalogue"
            aria-labelledby="oscar-catalogue-title"
          >
            <h2 id="oscar-catalogue-title">Award Winning Oscars</h2>
            {awardWinningMovies.length > 0 ? (
              <div className="movie-list">
                {awardWinningMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isFeatured={movie.id === featuredMovie.id}
                    onFeature={handleFeatureMovie}
                    onShowInfo={setMovieInfoSelection}
                    isSaved={savedMovieIds.includes(movie.id)}
                    onToggleSaved={handleToggleSaved}
                  />
                ))}
              </div>
            ) : (
              <p>No Oscar-winning movies found.</p>
            )}
          </section>
            </>
          )}
        </>
      )}
      <footer className="home-footer">
        <img
          className="home-footer-logo"
          src={logoImg}
          alt="Cindex"
          loading="lazy"
          draggable={false}
        />
        <p>© {copyrightYear} Cindex. All rights reserved.</p>
      </footer>
    </main>
  );
}

export default Home;
