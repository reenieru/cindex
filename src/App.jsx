import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import Home from "./components/Home";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import bgVideo from "./assets/Background.mp4";

function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

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
        <video
          className="auth-background-video"
          src={bgVideo}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate"
        />
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
