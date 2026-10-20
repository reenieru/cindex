import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import { useAuthBackgroundParallax } from "./animations/animationHooks";
import Home from "./components/Home";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const backgroundIframeRef = useAuthBackgroundParallax(
    authReady && !user,
  );

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
