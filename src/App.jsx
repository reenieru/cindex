import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import Home from "./components/Home";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const backgroundIframeRef = useRef(null);

  useEffect(() => {
    let currentUser = auth.currentUser;
    const syncPath = (isSignedIn) => {
      const currentPath = window.location.pathname;
      const destination = isSignedIn
        ? "/home"
        : currentPath === "/home"
          ? "/"
          : currentPath;

      if (destination !== currentPath) {
        window.history.replaceState({}, "", destination);
      }
      setPathname(destination);
    };

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      currentUser = nextUser;
      syncPath(Boolean(nextUser));
      setUser(nextUser);
      setAuthReady(true);
    });
    const handlePopState = () => syncPath(Boolean(currentUser));
    window.addEventListener("popstate", handlePopState);

    return () => {
      unsubscribe();
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const backgroundIframe = backgroundIframeRef.current;
    if (!backgroundIframe || !authReady || user) {
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
        backgroundIframe.style.setProperty("--cursor-x", `${offsetX}px`);
        backgroundIframe.style.setProperty("--cursor-y", `${offsetY}px`);
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [authReady, user]);

  const navigate = (destination) => {
    window.history.pushState({}, "", destination);
    setPathname(destination);
  };

  return (
    <div className="App">
      {!user && authReady && (
        <>
          <iframe
            ref={backgroundIframeRef}
            className="auth-background-iframe"
            src="https://www.youtube-nocookie.com/embed/Pa4vfd2JT68?autoplay=1&mute=1&controls=0&loop=1&playlist=Pa4vfd2JT68&playsinline=1&rel=0&modestbranding=1"
            title="Login background video"
            allow="autoplay; encrypted-media"
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="auth-background-gradient" aria-hidden="true" />
        </>
      )}
      {!authReady ? (
        <p>Loading...</p>
      ) : user ? (
        <Home />
      ) : pathname === "/signup" ? (
        <SignUp onSignIn={() => navigate("/")} />
      ) : (
        <SignIn onCreateAccount={() => navigate("/signup")} />
      )}
    </div>
  );
}

export default App;
