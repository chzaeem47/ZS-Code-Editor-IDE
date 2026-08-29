import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  signupUser,
  clearError,
  googleLoginUser,
} from "../redux/slices/authSlice";

import { useTheme } from "../context/ThemeContext";

import {
  FaUser,
  FaEye,
  FaEyeSlash,
  FaSun,
  FaMoon,
} from "react-icons/fa";

import { TfiEmail } from "react-icons/tfi";
import { MdLockOutline } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";

import { Link, useNavigate } from "react-router-dom";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase";

import { toast } from "react-toastify";

const Signup = () => {
  const { isDark, toggleTheme } = useTheme();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Clear Redux error when leaving the page
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ===============================
  // NORMAL SIGNUP
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      await dispatch(signupUser(formData)).unwrap();

      toast.success(
        "Account created successfully! Please login.",
        {
          position: "top-right",
          autoClose: 2500,
        }
      );

      // Signup does not automatically authenticate
      // the user, so send them to login.
      navigate("/login");
    } catch (error) {
      console.error("Signup failed:", error);

      const message =
        error?.message ||
        error?.error ||
        "Unable to create account. Please try again.";

      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // ===============================
  // GOOGLE SIGNUP / LOGIN
  // ===============================
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      const token = await result.user.getIdToken();

      await dispatch(
        googleLoginUser(token)
      ).unwrap();

      toast.success("Google login successful!", {
        position: "top-right",
        autoClose: 2500,
      });

      navigate("/");
    } catch (error) {
      console.error("Google Sign-In failed:", error);

      const message =
        error?.message ||
        error?.error ||
        "Google authentication failed.";

      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden bg-cover bg-center bg-no-repeat transition-all duration-500 ${
        isDark
          ? "bg-[url('/dark-background.png')]"
          : "bg-[url('/light-background.png')]"
      }`}
    >
      {/* ===============================
          THEME TOGGLE
      =============================== */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={
          isDark
            ? "Switch to light mode"
            : "Switch to dark mode"
        }
        className="fixed left-5 top-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/25 active:scale-95 sm:left-7 sm:top-7"
      >
        {isDark ? (
          <FaMoon className="h-[20px] w-[20px] text-cyan-200" />
        ) : (
          <FaSun className="h-[20px] w-[20px] text-yellow-300" />
        )}
      </button>

      {/* ===============================
          MAIN CONTENT
      =============================== */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col items-center justify-center gap-6 px-5 py-6 lg:flex-row lg:gap-10 lg:px-10 lg:py-5 xl:gap-16 xl:px-16">

        {/* ===============================
            LEFT SIDE
        =============================== */}
        <section className="flex w-full flex-col items-center justify-center text-center lg:w-[43%] lg:-translate-y-6 lg:translate-x-12 xl:-translate-y-10 xl:translate-x-20">

          {/* LOGO */}
          <div
            className={`h-20 w-20 bg-contain bg-center bg-no-repeat transition-all duration-500 sm:h-24 sm:w-24 lg:h-28 lg:w-28 xl:h-32 xl:w-32 ${
              isDark
                ? "bg-[url('/dark-logo.png')]"
                : "bg-[url('/light-logo.png')]"
            }`}
          />

          {/* ZS CODE */}
          <h1 className="mt-2 font-story text-4xl font-extrabold tracking-[0.14em] text-white sm:text-5xl lg:text-5xl xl:text-6xl">
            ZS CODE
          </h1>

          {/* TAGLINE */}
          <h3 className="mt-1 font-serif text-sm italic tracking-[0.12em] text-white/90 sm:text-base lg:text-lg">
            CODE. CREATE. ELEVATE.
          </h3>

          {/* WELCOME */}
          <div className="relative mt-7 inline-flex flex-col items-center sm:mt-8 lg:mt-9">

            <p className="relative z-10 whitespace-nowrap font-tangerine text-5xl leading-none text-white sm:text-6xl md:text-7xl xl:text-8xl">
              Welcome
            </p>

            {/* CURVY AQUA LINE */}
            <svg
              className="relative z-0 -mt-2 w-36 sm:w-44 md:w-52"
              viewBox="0 0 200 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="aquaLineSignup"
                  x1="0"
                  y1="0"
                  x2="200"
                  y2="0"
                >
                  <stop stopColor="#00E5FF" />
                  <stop
                    offset="0.5"
                    stopColor="#3EE9E5"
                  />
                  <stop
                    offset="1"
                    stopColor="#38BDF8"
                    stopOpacity="0.25"
                  />
                </linearGradient>
              </defs>

              <path
                d="M5 15 C45 2, 80 25, 115 14 C145 5, 170 10, 195 8"
                stroke="url(#aquaLineSignup)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* DESCRIPTION */}
          <p className="mt-4 max-w-sm text-center font-sans text-sm italic leading-relaxed text-white/90 sm:text-base lg:text-[16px]">
            Create your account to get started
            <br />
            and explore endless possibilities.
          </p>
        </section>

        {/* ===============================
            RIGHT SIDE
        =============================== */}
        <section className="flex w-full justify-center lg:w-[57%] lg:-translate-x-10">

          {/* GLASS CARD */}
          <div className="relative w-full max-w-[620px] overflow-hidden rounded-[34px] border border-white/20 bg-white/[0.01] px-5 py-7 shadow-[inset_0_5px_5px_rgba(255,255,255,0.6),inset_0_-8px_16px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.8),0_25px_60px_-15px_rgba(0,0,0,0.4)] backdrop-blur-3xl sm:px-8 sm:py-8 lg:max-w-[600px] lg:px-9 lg:py-8 xl:max-w-[620px] xl:px-10">

            {/* TOP GLASS HIGHLIGHT */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.16] via-white/[0.04] to-transparent" />

            <div className="relative z-10">

              {/* HEADING */}
              <div className="text-center">

                <h2 className="font-serif text-2xl font-bold italic tracking-wide text-white sm:text-3xl lg:text-[32px]">
                  Create Your Account
                </h2>

                <p className="mt-2 text-sm italic tracking-wide text-white/75 sm:text-[15px]">
                  Join{" "}
                  <span className="font-serif font-semibold italic tracking-wide text-cyan-300">
                    ZS CODE
                  </span>{" "}
                  and start your journey with us
                </p>

              </div>

              {/* FORM */}
              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-3"
              >

                {/* NAME */}
                <div className="group relative rounded-full border border-white/[0.18] bg-white/[0.10] shadow-inner shadow-white/[0.04] transition-all duration-300 hover:bg-white/[0.14] focus-within:border-cyan-300/60 focus-within:bg-white/[0.15]">

                  <FaUser className="pointer-events-none absolute left-5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/70 group-focus-within:text-cyan-300" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    placeholder="Full Name"
                    className="h-[58px] w-full rounded-full bg-transparent pl-14 pr-5 text-[15px] text-white placeholder:text-white/65 outline-none sm:text-base"
                  />

                </div>

                {/* EMAIL */}
                <div className="group relative rounded-full border border-white/[0.18] bg-white/[0.10] shadow-inner shadow-white/[0.04] transition-all duration-300 hover:bg-white/[0.14] focus-within:border-cyan-300/60 focus-within:bg-white/[0.15]">

                  <TfiEmail className="pointer-events-none absolute left-5 top-1/2 h-[19px] w-[19px] -translate-y-1/2 text-white/70 group-focus-within:text-cyan-300" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="Email Address"
                    className="h-[58px] w-full rounded-full bg-transparent pl-14 pr-5 text-[15px] text-white placeholder:text-white/65 outline-none sm:text-base"
                  />

                </div>

                {/* PASSWORD */}
                <div className="group relative rounded-full border border-white/[0.18] bg-white/[0.10] shadow-inner shadow-white/[0.04] transition-all duration-300 hover:bg-white/[0.14] focus-within:border-cyan-300/60 focus-within:bg-white/[0.15]">

                  <MdLockOutline className="pointer-events-none absolute left-5 top-1/2 h-[21px] w-[21px] -translate-y-1/2 text-white/70 group-focus-within:text-cyan-300" />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder="Password"
                    className="h-[58px] w-full rounded-full bg-transparent pl-14 pr-14 text-[15px] text-white placeholder:text-white/65 outline-none sm:text-base"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center justify-center text-white/70 transition-all duration-300 hover:text-cyan-300"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-[18px] w-[18px]" />
                    ) : (
                      <FaEye className="h-[18px] w-[18px]" />
                    )}
                  </button>

                </div>

                {/* SIGN UP */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative mt-5 flex h-[58px] w-full items-center justify-center rounded-full border border-white/20 bg-gradient-to-r from-[#1227b2] via-[#0e2667] to-[#1227b2] font-cookie text-4xl font-bold tracking-widest text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.01] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating..." : "Sign Up"}
                </button>

              </form>

              {/* OR */}
              <div className="my-5 flex items-center gap-4">

                <div className="h-px flex-1 bg-white/15" />

                <span className="text-sm text-white/70">
                  OR
                </span>

                <div className="h-px flex-1 bg-white/15" />

              </div>

              {/* GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex h-[58px] w-full items-center justify-center gap-2 rounded-full border border-white/60 bg-white/90 font-serif text-[18px] font-semibold text-[#273249] shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.01] hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FcGoogle className="h-[30px] w-[30px] shrink-0" />

                Continue with Google
              </button>

              {/* LOGIN */}
              <p className="mt-6 text-center font-serif text-[15px] italic text-white/80">

                Already have an Account?{" "}

                <Link
                  to="/login"
                  className="font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  Login
                </Link>

              </p>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Signup;