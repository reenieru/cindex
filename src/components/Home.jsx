import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import logoImg from "../assets/LogoWText.png";
import MovieForm from "./MovieForm";
import MovieCard from "./MovieCard";
import FeaturedMovieCarousel from "./FeaturedMovieCarousel";
import MovieInfoModal from "./MovieInfoModal";
import {
  useCabinetReveal,
  useMinimumLoadingTime,
  useMovieCardAnimationController,
} from "../animations/animationHooks";
import "./Homepage.css";

const copyrightYear = new Date().getFullYear();
const moviesCollectionRef = collection(db, "movies");

function MovieCabinet({ className, id, titleId, title, children }) {
  const cabinetRef = useRef(null);
  const isOpen = useCabinetReveal(cabinetRef);

  return (
    <section
      ref={cabinetRef}
      className={`${className} movie-cabinet`}
      data-open={isOpen}
      id={id}
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      {children}
    </section>
  );
}

function Home() {
  const [movies, setMovies] = useState([]);
  const [featuredMovieId, setFeaturedMovieId] = useState(null);
  const {
    expandedMovieId,
    isClosing: isClosingExpandedMovie,
    open: handleExpandMovie,
    close: handleCloseExpandedMovie,
    finishClosing: finishClosingExpandedMovie,
  } = useMovieCardAnimationController();
  const [movieInfoSelection, setMovieInfoSelection] = useState(null);
  const [movieInfoDirection, setMovieInfoDirection] = useState("next");
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieFormKey, setMovieFormKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const hasMinimumLoadingTime = useMinimumLoadingTime();
  const [loadError, setLoadError] = useState(null);
  const [logoutError, setLogoutError] = useState("");

  // READ: Fetch movie documents from the Firestore collection.
  const getMovieList = useCallback(async () => {
    const snapshot = await getDocs(moviesCollectionRef);
    const rawMovieList = snapshot.docs.map((movieDocument) => ({
      ...movieDocument.data(),
      id: movieDocument.id,
    }));
    console.log("Movie data from Firestore:", rawMovieList);

    const filteredData = rawMovieList.map((movieData) => {
      return {
        id: movieData.id,
        title: movieData.title,
        description: movieData.description ?? "",
        ReleaseYear: movieData.ReleaseYear,
        genre: movieData.genre ?? [],
        poster_url: movieData.poster_url ?? "",
        backdrop_url: movieData.backdrop_url ?? "",
        trailer_url: movieData.trailer_url ?? "",
        mtrcb_rating: movieData.mtrcb_rating ?? "",
        ReceivedOscar: movieData.ReceivedOscar,
        cast: movieData.cast ?? [],
        director: movieData.director ?? "",
        ...(movieData.runtime !== undefined && {
          runtime: movieData.runtime,
        }),
        ...(movieData.average_rating !== undefined && {
          average_rating: movieData.average_rating,
        }),
      };
    });
    console.log("Filtered movie data:", filteredData);
    return filteredData;
  }, []);

  useEffect(() => {
    let isCurrent = true;

    getMovieList()
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
  }, [getMovieList]);

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Failed to sign out.", error);
      setLogoutError("Could not sign out. Please try again.");
    }
  };

  const featuredMovie = movies.find((movie) => movie.id === featuredMovieId) ?? movies[0] ?? null;
  const awardWinningMovies = movies.filter(
    (movie) => movie.ReceivedOscar === true,
  );

  const handleFeatureMovie = useCallback((movieId) => {
    if (movieId !== featuredMovieId) {
      setFeaturedMovieId(movieId);
    }
  }, [featuredMovieId]);

  const handleCloseMovieInfo = useCallback(() => {
    setMovieInfoSelection(null);
  }, []);

  function handleEditMovie(movie) {
    setMovieInfoSelection(null);
    setEditingMovie(movie);
    setMovieFormKey((key) => key + 1);
    setShowAddMovie(true);
  }

  const handleShowMovieInfo = (movie, fromExpandedCard) => {
    if (fromExpandedCard) {
      handleCloseExpandedMovie(() => setMovieInfoSelection(movie));
    } else {
      setMovieInfoSelection(movie);
    }
  };

  const handleDeleteMovie = async (movie) => {
    try {
      // DELETE: Remove this movie document from Firestore.
      await deleteDoc(doc(db, "movies", movie.id));
    } catch (error) {
      console.error("Failed to delete movie from Firestore.", error);
      throw error;
    }

    const remainingMovies = movies.filter(
      (currentMovie) => currentMovie.id !== movie.id,
    );
    setMovies(remainingMovies);
    setFeaturedMovieId((currentId) =>
      currentId === movie.id ? remainingMovies[0]?.id ?? null : currentId,
    );
    setMovieInfoSelection(null);
  };

  return (
    <main className="homepage">
      {isLoading || !hasMinimumLoadingTime ? (
        <section className="home-loading-screen" aria-label="Loading Cindex">
          <img
            className="home-loading-logo"
            src={logoImg}
            alt="Cindex"
            draggable={false}
          />
          <div
            className="home-loading-track"
            role="progressbar"
            aria-label="Loading movies"
            aria-valuetext="Loading"
          >
            <span className="home-loading-line" />
          </div>
        </section>
      ) : loadError ? (
        <section className="home-status" role="alert">
          <h1>Could not load movies</h1>
          <p>
            {loadError.code}: {loadError.message}
          </p>
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
                <a className="home-nav-link" href="#movies">
                  Movies
                </a>
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
              movies={movies}
              slideDirection={movieInfoDirection}
              onMovieChange={(nextMovie, direction) => {
                setMovieInfoDirection(direction);
                setMovieInfoSelection(nextMovie);
              }}
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
          <FeaturedMovieCarousel
            movies={movies}
            featuredMovieId={featuredMovie?.id}
            onFeatureMovie={handleFeatureMovie}
          />

          <MovieCabinet
            className="movie-catalogue"
            id="movies"
            titleId="catalogue-title"
            title="Movies"
          >
            {movies.length > 0 ? (
              <div className="movie-list">
                {movies.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    bayNumber={index + 1}
                    isFeatured={movie.id === featuredMovie.id}
                    isExpanded={movie.id === expandedMovieId}
                    isClosing={isClosingExpandedMovie}
                    onFeature={handleFeatureMovie}
                    onExpand={handleExpandMovie}
                    onCloseExpanded={handleCloseExpandedMovie}
                    onCloseAnimationEnd={finishClosingExpandedMovie}
                    onShowInfo={handleShowMovieInfo}
                  />
                ))}
              </div>
            ) : (
              <p>No movies found.</p>
            )}
          </MovieCabinet>

          <MovieCabinet
            className="movie-catalogue oscar-catalogue"
            titleId="oscar-catalogue-title"
            title="Award Winning Oscars"
          >
            {awardWinningMovies.length > 0 ? (
              <div className="movie-list">
                {awardWinningMovies.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    bayNumber={index + 1}
                    isFeatured={movie.id === featuredMovie.id}
                    isExpanded={movie.id === expandedMovieId}
                    isClosing={isClosingExpandedMovie}
                    onFeature={handleFeatureMovie}
                    onExpand={handleExpandMovie}
                    onCloseExpanded={handleCloseExpandedMovie}
                    onCloseAnimationEnd={finishClosingExpandedMovie}
                    onShowInfo={handleShowMovieInfo}
                  />
                ))}
              </div>
            ) : (
              <p>No Oscar-winning movies found.</p>
            )}
          </MovieCabinet>
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
