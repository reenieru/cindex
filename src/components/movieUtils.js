export const getReleaseYear = (releaseDate) => {
  if (releaseDate && typeof releaseDate === "object") {
    if (typeof releaseDate.toDate === "function") {
      return String(releaseDate.toDate().getUTCFullYear());
    }

    const seconds = releaseDate.seconds ?? releaseDate._seconds;
    if (typeof seconds === "number") {
      return String(new Date(seconds * 1000).getUTCFullYear());
    }
  }

  const year = String(releaseDate || "").match(/\b\d{4}\b/);
  return year ? year[0] : null;
};

export const getMovieGenres = (movie) => {
  const genres = movie?.genre ?? movie?.genres;
  if (Array.isArray(genres)) {
    return genres.filter(Boolean).map(String);
  }

  if (typeof genres === "string") {
    return genres
      .split(/[,|*]/)
      .map((genre) => genre.trim())
      .filter(Boolean);
  }

  return [];
};

export const formatRuntime = (runtime) => {
  const totalMinutes = Number(runtime);
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
    return null;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
};

export const getMtrcbRatingClass = (rating) => {
  const normalizedRating = String(rating || "").trim().toUpperCase();

  if (normalizedRating === "G") {
    return "g";
  }

  if (normalizedRating === "PG" || normalizedRating.startsWith("PG-")) {
    return "pg";
  }

  if (normalizedRating === "R-13") {
    return "r13";
  }

  if (normalizedRating === "R-16") {
    return "r16";
  }

  if (normalizedRating === "R-18") {
    return "r18";
  }

  if (normalizedRating === "X") {
    return "x";
  }

  return "";
};

export const getTrailerSource = (url, autoplay = false) => {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    let videoId;

    if (host === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v");
      } else if (
        parsedUrl.pathname.startsWith("/embed/") ||
        parsedUrl.pathname.startsWith("/shorts/")
      ) {
        videoId = parsedUrl.pathname.split("/")[2];
      }
    }

    if (videoId) {
      const params = new URLSearchParams({
        autoplay: autoplay ? "1" : "0",
        mute: autoplay ? "1" : "0",
        controls: autoplay ? "0" : "1",
        playsinline: "1",
        rel: "0",
        cc_load_policy: "0",
      });
      return {
        type: "embed",
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`,
      };
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const vimeoId =
        host === "player.vimeo.com"
          ? parsedUrl.pathname.split("/").filter(Boolean).at(-1)
          : parsedUrl.pathname.split("/").filter(Boolean)[0];

      if (vimeoId && /^\d+$/.test(vimeoId)) {
        const params = new URLSearchParams({
          autoplay: autoplay ? "1" : "0",
          muted: autoplay ? "1" : "0",
          controls: autoplay ? "0" : "1",
        });
        return {
          type: "embed",
          src: `https://player.vimeo.com/video/${vimeoId}?${params}`,
        };
      }
    }

    if (/\.(mp4|webm|ogg)$/i.test(parsedUrl.pathname)) {
      return { type: "video", src: parsedUrl.href };
    }
  } catch {
    return null;
  }

  return null;
};
