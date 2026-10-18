import { useState } from "react";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import "./MovieForm.css";

const emptyMovieForm = {
  title: "",
  description: "",
  release_date: "",
  runtime: "",
  genre: "",
  poster_url: "",
  backdrop_url: "",
  trailer_url: "",
  average_rating: "",
  mtrcb_rating: "",
  hasOscar: false,
  cast: "",
  director: "",
};

const mtrcbRatings = ["G", "PG", "PG-13", "R-13", "R-16", "R-18", "X"];

const movieToForm = (movie) => ({
  ...emptyMovieForm,
  title: movie.title || "",
  description: movie.description || "",
  release_date:
    typeof movie.release_date === "string"
      ? movie.release_date
      : movie.release_date?.toDate instanceof Function
        ? movie.release_date.toDate().toISOString().slice(0, 10)
        : "",
  runtime: movie.runtime == null ? "" : String(movie.runtime),
  genre: Array.isArray(movie.genre ?? movie.genres)
    ? (movie.genre ?? movie.genres).join(", ")
    : movie.genre || movie.genres || "",
  poster_url: movie.poster_url || "",
  backdrop_url: movie.backdrop_url || "",
  trailer_url: movie.trailer_url || "",
  average_rating:
    movie.average_rating == null ? "" : String(movie.average_rating),
  mtrcb_rating: movie.mtrcb_rating || "",
  hasOscar: movie.hasOscar === true,
  cast: Array.isArray(movie.cast)
    ? movie.cast
        .map((member) =>
          typeof member === "string"
            ? member
            : `${member.actor_name || ""} | ${member.character || ""}`,
        )
        .join("\n")
    : "",
  director: movie.director || "",
});

const prepareMovieData = (form) => {
  const cast = form.cast
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [actorName, ...characterParts] = line.split("|");
      return {
        actor_name: actorName.trim(),
        character: characterParts.join("|").trim(),
      };
    });

  if (cast.some((member) => !member.actor_name || !member.character)) {
    return {
      error: "Enter each cast member as Actor Name | Character, one per line.",
    };
  }

  const runtime = form.runtime.trim() ? Number(form.runtime) : undefined;
  const averageRating = form.average_rating.trim()
    ? Number(form.average_rating)
    : undefined;

  if (
    (runtime !== undefined && (!Number.isFinite(runtime) || runtime < 0)) ||
    (averageRating !== undefined &&
      (!Number.isFinite(averageRating) || averageRating < 0))
  ) {
    return {
      error: "Runtime and average rating must be valid nonnegative numbers.",
    };
  }

  return {
    movieData: {
      title: form.title.trim(),
      description: form.description.trim(),
      release_date: form.release_date.trim(),
      genre: form.genre
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean),
      poster_url: form.poster_url.trim(),
      backdrop_url: form.backdrop_url.trim(),
      trailer_url: form.trailer_url.trim(),
      mtrcb_rating: form.mtrcb_rating.trim(),
      hasOscar: form.hasOscar,
      cast,
      director: form.director.trim(),
      ...(runtime !== undefined && { runtime }),
      ...(averageRating !== undefined && { average_rating: averageRating }),
    },
  };
};

function MovieForm({
  isOpen,
  movie,
  onClose,
  onMovieAdded,
  onMovieUpdated,
}) {
  const [movieForm, setMovieForm] = useState(() =>
    movie ? movieToForm(movie) : { ...emptyMovieForm },
  );
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (!isSaving) {
      setIsClosing(true);
    }
  };

  const handleAnimationEnd = (event) => {
    if (
      event.target === event.currentTarget &&
      event.animationName === "movie-form-dialog-out"
    ) {
      onClose();
    }
  };

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    setMovieForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateMovie = async (movieData) => {
    try {
      const movieCollection = collection(db, "movies");

      const movieDocument = await addDoc(movieCollection, {
        title: movieData.title,
        description: movieData.description,
        release_date: movieData.release_date,
        genre: movieData.genre,
        poster_url: movieData.poster_url,
        backdrop_url: movieData.backdrop_url,
        trailer_url: movieData.trailer_url,
        mtrcb_rating: movieData.mtrcb_rating,
        hasOscar: movieData.hasOscar,
        cast: movieData.cast,
        director: movieData.director,
        ...(movieData.runtime !== undefined && {
          runtime: movieData.runtime,
        }),
        ...(movieData.average_rating !== undefined && {
          average_rating: movieData.average_rating,
        }),
      });

      onMovieAdded({
        id: movieDocument.id,
        title: movieData.title,
        description: movieData.description,
        release_date: movieData.release_date,
        genre: movieData.genre,
        poster_url: movieData.poster_url,
        backdrop_url: movieData.backdrop_url,
        trailer_url: movieData.trailer_url,
        mtrcb_rating: movieData.mtrcb_rating,
        hasOscar: movieData.hasOscar,
        cast: movieData.cast,
        director: movieData.director,
        ...(movieData.runtime !== undefined && {
          runtime: movieData.runtime,
        }),
        ...(movieData.average_rating !== undefined && {
          average_rating: movieData.average_rating,
        }),
      });
      setIsClosing(true);
    } catch (error) {
      console.error("Failed to add movie in Firestore.", error);
      setFormError(
        `Could not add movie: ${error.message || "Unknown Firestore error"}`,
      );
    }
  };

  const handleUpdateMovie = async (movieId, movieData) => {
    try {
      await setDoc(doc(db, "movies", movieId), {
        title: movieData.title,
        description: movieData.description,
        release_date: movieData.release_date,
        genre: movieData.genre,
        poster_url: movieData.poster_url,
        backdrop_url: movieData.backdrop_url,
        trailer_url: movieData.trailer_url,
        mtrcb_rating: movieData.mtrcb_rating,
        hasOscar: movieData.hasOscar,
        cast: movieData.cast,
        director: movieData.director,
        ...(movieData.runtime !== undefined && {
          runtime: movieData.runtime,
        }),
        ...(movieData.average_rating !== undefined && {
          average_rating: movieData.average_rating,
        }),
      });

      onMovieUpdated({
        id: movieId,
        title: movieData.title,
        description: movieData.description,
        release_date: movieData.release_date,
        genre: movieData.genre,
        poster_url: movieData.poster_url,
        backdrop_url: movieData.backdrop_url,
        trailer_url: movieData.trailer_url,
        mtrcb_rating: movieData.mtrcb_rating,
        hasOscar: movieData.hasOscar,
        cast: movieData.cast,
        director: movieData.director,
        ...(movieData.runtime !== undefined && {
          runtime: movieData.runtime,
        }),
        ...(movieData.average_rating !== undefined && {
          average_rating: movieData.average_rating,
        }),
      });
      setIsClosing(true);
    } catch (error) {
      console.error("Failed to update movie in Firestore.", error);
      setFormError(
        error.code === "permission-denied"
          ? "You do not have permission to update movies. Update the movies collection rules in Firebase."
          : `Could not update movie: ${error.message || "Unknown Firestore error"}`,
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const { error: validationError, movieData } =
      prepareMovieData(movieForm);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      if (movie) {
        await handleUpdateMovie(movie.id, movieData);
      } else {
        await handleCreateMovie(movieData);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`movie-form-backdrop${isClosing ? " movie-form-backdrop-closing" : ""}`}
    >
      <section
        className={`movie-form-dialog${isClosing ? " movie-form-dialog-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-form-title"
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="movie-form-heading">
          <h2 id="movie-form-title">{movie ? "Edit Movie" : "Add a Movie"}</h2>
          <button
            className="movie-form-close"
            type="button"
            aria-label={`Close ${movie ? "edit" : "add"} movie form`}
            disabled={isSaving}
            onClick={handleClose}
          >
            ×
          </button>
        </div>
        <form className="movie-form" onSubmit={handleSubmit}>
          <label>
            Title *
            <input
              name="title"
              value={movieForm.title}
              onChange={handleChange}
              required
              autoFocus
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows="3"
              value={movieForm.description}
              onChange={handleChange}
            />
          </label>
          <div className="movie-form-grid">
            <label>
              Release date
              <input
                name="release_date"
                type="date"
                value={movieForm.release_date}
                onChange={handleChange}
              />
            </label>
            <label>
              Runtime (minutes)
              <input
                name="runtime"
                type="number"
                min="0"
                step="1"
                value={movieForm.runtime}
                onChange={handleChange}
              />
            </label>
            <label>
              Genres (comma-separated)
              <input
                name="genre"
                placeholder="Drama, History"
                value={movieForm.genre}
                onChange={handleChange}
              />
            </label>
            <label>
              Average rating
              <input
                name="average_rating"
                type="number"
                min="0"
                step="any"
                value={movieForm.average_rating}
                onChange={handleChange}
              />
            </label>
            <label>
              MTRCB rating
              <select
                name="mtrcb_rating"
                value={movieForm.mtrcb_rating}
                onChange={handleChange}
              >
                <option value="">Select rating</option>
                {movieForm.mtrcb_rating &&
                  !mtrcbRatings.includes(movieForm.mtrcb_rating) && (
                    <option value={movieForm.mtrcb_rating}>
                      {movieForm.mtrcb_rating}
                    </option>
                  )}
                {mtrcbRatings.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Director
              <input
                name="director"
                value={movieForm.director}
                onChange={handleChange}
              />
            </label>
          </div>
          <label>
            Poster URL
            <input
              name="poster_url"
              type="url"
              value={movieForm.poster_url}
              onChange={handleChange}
            />
          </label>
          <label>
            Backdrop URL
            <input
              name="backdrop_url"
              type="url"
              value={movieForm.backdrop_url}
              onChange={handleChange}
            />
          </label>
          <label>
            Trailer URL
            <input
              name="trailer_url"
              type="url"
              value={movieForm.trailer_url}
              onChange={handleChange}
            />
          </label>
          <label>
            Cast (one per line: Actor Name | Character)
            <textarea
              name="cast"
              rows="3"
              placeholder="Actor Name | Character Name"
              value={movieForm.cast}
              onChange={handleChange}
            />
          </label>
          <label className="movie-form-checkbox">
            <input
              name="hasOscar"
              type="checkbox"
              checked={movieForm.hasOscar}
              onChange={handleChange}
            />
            Has Oscar
          </label>
          {formError && (
            <p className="movie-form-error" role="alert">
              {formError}
            </p>
          )}
          <button
            className="movie-form-submit"
            type="submit"
            disabled={isSaving}
          >
            {isSaving
              ? movie
                ? "Saving Changes..."
                : "Adding Movie..."
              : movie
                ? "Save Changes"
                : "Add Movie"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default MovieForm;
