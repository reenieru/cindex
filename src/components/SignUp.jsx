import { useState } from "react";
import { auth, googleProvider } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import emailIcon from "../assets/Email.png";
import googleIcon from "../assets/GoogleIcon.png";
import keyIcon from "../assets/Key.png";
import logoImg from "../assets/LogoWText.png";
import "./SignUp.css";

export const SignUp = ({ onSignIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignUp = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  const handleGoogleSignUp = async () => {
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

      <div className="glass-card">
        <h2>Create an Account</h2>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <form onSubmit={handleSignUp}>
          <div className="input-group">
            <label htmlFor="signup-email">Email Address</label>
            <div className="input-field">
              <img className="icon" src={emailIcon} alt="" aria-hidden="true" />
              <input
                id="signup-email"
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
            <label htmlFor="signup-password">Password</label>
            <div className="input-field">
              <img className="icon" src={keyIcon} alt="" aria-hidden="true" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="input-field">
              <img className="icon" src={keyIcon} alt="" aria-hidden="true" />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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

          <div className="auth-switch">
            Already have an account?{" "}
            <button type="button" className="auth-switch-link" onClick={onSignIn}>
              Sign in
            </button>
          </div>

          <button type="submit" className="submit-btn">
            Sign Up
          </button>
        </form>

        <div className="divider">
          <span>OR SIGN UP USING</span>
        </div>

        <button
          className="google-btn"
          type="button"
          onClick={handleGoogleSignUp}
          aria-label="Sign up with Google"
        >
          <img src={googleIcon} alt="" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default SignUp;
