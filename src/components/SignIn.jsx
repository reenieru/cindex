import { useState } from "react";
import { auth, googleProvider } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import emailIcon from "../assets/Email.png";
import googleIcon from "../assets/GoogleIcon.png";
import keyIcon from "../assets/Key.png";
import logoImg from "../assets/LogoWText.png";
import "./SignUp.css";

export const SignIn = ({ onCreateAccount }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="brand-header">
        <img
          src={logoImg}
          alt="Cindex Logo"
          className="brand-logo-img"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>

      <div className="glass-card signin-card">
        <h2>
          Sign in
          <br />
          to your Account
        </h2>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <form onSubmit={handleSignIn}>
          <div className="input-group">
            <label htmlFor="signin-email">Email Address</label>
            <div className="input-field">
              <img className="icon" src={emailIcon} alt="" aria-hidden="true" />
              <input
                id="signin-email"
                type="email"
                placeholder="Example@gmail.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="signin-password">Password</label>
            <div className="input-field">
              <img className="icon" src={keyIcon} alt="" aria-hidden="true" />
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-eye"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁" : "◎"}
              </button>
            </div>
          </div>

          <div className="auth-switch auth-switch-signin">
            New to CINDEX?{" "}
            <button
              type="button"
              className="auth-switch-link"
              onClick={onCreateAccount}
            >
              Create an account
            </button>
          </div>

          <button type="submit" className="submit-btn">
            Sign In
          </button>
        </form>

        <div className="divider">
          <span>OR SIGN IN USING</span>
        </div>

        <button
          className="google-btn"
          type="button"
          onClick={handleGoogleSignIn}
          aria-label="Sign in with Google"
        >
          <img src={googleIcon} alt="" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default SignIn;
