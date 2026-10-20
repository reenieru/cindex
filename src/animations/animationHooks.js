import { useCallback, useEffect, useRef, useState } from "react";

export function useMinimumLoadingTime(duration = 2000) {
  const [hasElapsed, setHasElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHasElapsed(true), duration);
    return () => window.clearTimeout(timer);
  }, [duration]);

  return hasElapsed;
}

export function useCabinetReveal(cabinetRef) {
  const [isOpen, setIsOpen] = useState(
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window),
  );

  useEffect(() => {
    const cabinet = cabinetRef.current;
    if (
      !cabinet ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOpen(entry.isIntersecting);
      },
      { threshold: 0.16 },
    );
    observer.observe(cabinet);

    return () => observer.disconnect();
  }, [cabinetRef]);

  return isOpen;
}

export function useAuthBackgroundParallax(enabled) {
  const backgroundRef = useRef(null);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background || !enabled) {
      return undefined;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let animationFrame = 0;

    const handlePointerMove = (event) => {
      if (event.pointerType !== "mouse" || reducedMotion.matches) {
        return;
      }

      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const offsetX = (event.clientX / window.innerWidth - 0.5) * 12;
        const offsetY = (event.clientY / window.innerHeight - 0.5) * 12;
        background.style.setProperty("--cursor-x", `${offsetX}px`);
        background.style.setProperty("--cursor-y", `${offsetY}px`);
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [enabled]);

  return backgroundRef;
}

export function useFeaturedMovieAnimation({
  currentFeaturedMovieId,
  featuredMovie,
  movies,
  onFeatureMovie,
}) {
  const [revealedTrailerMovieId, setRevealedTrailerMovieId] = useState(null);

  useEffect(() => {
    if (!currentFeaturedMovieId) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => setRevealedTrailerMovieId(currentFeaturedMovieId),
      1500,
    );
    return () => window.clearTimeout(timer);
  }, [currentFeaturedMovieId]);

  useEffect(() => {
    if (movies.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const currentIndex = movies.findIndex(
        (movie) => movie.id === featuredMovie?.id,
      );
      const nextMovie = movies[(currentIndex + 1) % movies.length];
      if (nextMovie) {
        onFeatureMovie(nextMovie.id);
      }
    }, 18000);

    return () => window.clearInterval(timer);
  }, [movies, featuredMovie, onFeatureMovie]);

  return revealedTrailerMovieId === currentFeaturedMovieId;
}

export function useMovieCardAnimationController() {
  const [expandedMovieId, setExpandedMovieId] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);
  const afterCloseRef = useRef(null);

  const finishClosing = useCallback(() => {
    if (!isClosingRef.current) {
      return;
    }

    setExpandedMovieId(null);
    setIsClosing(false);
    isClosingRef.current = false;
    const afterClose = afterCloseRef.current;
    afterCloseRef.current = null;
    afterClose?.();
  }, []);

  const open = useCallback((movieId) => {
    isClosingRef.current = false;
    afterCloseRef.current = null;
    setIsClosing(false);
    setExpandedMovieId(movieId);
  }, []);

  const close = useCallback(
    (afterClose = null) => {
      if (!expandedMovieId || isClosingRef.current) {
        return;
      }

      isClosingRef.current = true;
      afterCloseRef.current = afterClose;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishClosing();
        return;
      }
      setIsClosing(true);
    },
    [expandedMovieId, finishClosing],
  );

  useEffect(() => {
    if (!expandedMovieId) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedMovieId, close]);

  return {
    expandedMovieId,
    isClosing,
    open,
    close,
    finishClosing,
  };
}

export function useMovieCardTilt() {
  const handlePointerMove = useCallback((event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const tiltRange = Number.parseFloat(
      window
        .getComputedStyle(event.currentTarget)
        .getPropertyValue("--card-tilt-range"),
    );
    const horizontalPosition =
      (event.clientX - bounds.left) / bounds.width - 0.5;
    const verticalPosition =
      (event.clientY - bounds.top) / bounds.height - 0.5;

    event.currentTarget.style.setProperty(
      "--card-rotate-x",
      `${-verticalPosition * tiltRange}deg`,
    );
    event.currentTarget.style.setProperty(
      "--card-rotate-y",
      `${horizontalPosition * tiltRange}deg`,
    );
  }, []);

  const handlePointerLeave = useCallback((event) => {
    event.currentTarget.style.removeProperty("--card-rotate-x");
    event.currentTarget.style.removeProperty("--card-rotate-y");
  }, []);

  return {
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
  };
}

export function useMovieCardAnimationEnd(
  isExpanded,
  isClosing,
  onCloseAnimationEnd,
) {
  return useCallback(
    (event) => {
      if (
        isExpanded &&
        isClosing &&
        event.animationName === "movie-card-collapse-out"
      ) {
        onCloseAnimationEnd();
      }
    },
    [isExpanded, isClosing, onCloseAnimationEnd],
  );
}

export function useMovieFormAnimation(onClose) {
  const [isClosing, setIsClosing] = useState(false);

  const close = useCallback(() => setIsClosing(true), []);
  const handleAnimationEnd = useCallback(
    (event) => {
      if (
        event.target === event.currentTarget &&
        event.animationName === "movie-form-dialog-out"
      ) {
        onClose();
      }
    },
    [onClose],
  );

  return { isClosing, close, handleAnimationEnd };
}
