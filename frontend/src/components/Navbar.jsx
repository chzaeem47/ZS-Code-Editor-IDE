import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaChevronDown, FaSun, FaMoon, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { logout } from "../features/logout";
import { logoutLocal } from "../redux/slices/authSlice";

const Navbar = () => {
    const { isDark, toggleTheme } = useTheme();
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const getInitials = (name = "") => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

    const getFirstName = (name = "") => name.trim().split(/\s+/)[0] || "User";

    const handleLogout = async () => {
        await logout();
        dispatch(logoutLocal());
        setOpen(false);
        navigate("/");
    };

    return (
        <nav className="fixed left-0 right-0 top-0 z-50">
            <div className={`mx-auto flex h-[50px] max-w-[1520px] rounded-2xl translate-y-2 items-center justify-between border-b px-4 backdrop-blur-3xl effect-less transition-all duration-500 sm:px-5 ${isDark ? "border-slate-800/80 bg-slate-900/90" : "border-black/10 bg-white/70"}`}>

                {/* LOGO */}
                <button type="button" onClick={() => navigate("/")} className="flex items-center w-10">
                    <div className={`bg-contain bg-center bg-no-repeat transition-all duration-500 sm:h-14 sm:w-14 ${isDark ? "bg-[url('/dark-logo.png')]" : "bg-[url('/light-logo.png')]"}`} />
                </button>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-2 sm:gap-3">

                    {/* THEME */}
                    <button type="button" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} className={`effect-less flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 sm:h-9 sm:w-9 ${isDark ? "border-white bg-black/10 text-cyan-400 hover:bg-white/20" : "border-black/10 bg-black/5 text-yellow-500 hover:bg-black/10"}`}>
                        {isDark ? <FaMoon className="text-[19px]" /> : <FaSun className="text-[19px]" />}
                    </button>

                    {/* LOGIN / SIGNUP */}
                    {!user ? (
                        <div className="flex items-center gap-2 sm:gap-3">

                            <button type="button" onClick={() => navigate("/login")} className="effect-3d flex h-11 items-center justify-center rounded-full bg-gradient-to-b from-[#0b165d] via-[#1227b2]/80 to-[#0641e2] px-4 font-cookie text-[22px] tracking-wide text-white border border-white/40 transition-all duration-300 hover:scale-[1.03] hover:active:scale-[0.98] sm:h-9 sm:px-5 sm:text-[26px]">
                                Login
                            </button>

                            <button type="button" onClick={() => navigate("/signup")} className={`flex h-11 items-center effect-3d justify-center rounded-full px-4 font-cookie text-[22px] border tracking-wide backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] sm:h-9 sm:px-5 sm:text-[24px] ${isDark ? "border-white bg-purple-800 text-white" : "border-black/15 bg-black/5 text-[#1227b2]"}`}>
                                Sign Up
                            </button>

                        </div>
                    ) : (

                        <div ref={menuRef} className="relative">

                            <button type="button" onClick={() => setOpen((prev) => !prev)} className={`font-serif effect-3d flex h-11 items-center gap-2 rounded-full border px-1.5 py-1.5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] sm:h-10 sm:gap-2.5 sm:pl-1.5 sm:pr-3 ${isDark ? "border-white/20 bg-gradient-to-r from-[#050c37] via-[#120bd1] to-[#050c37]/90 text-white"
                                : "text-white border-indigo-200/80 bg-gradient-to-r from-[#0212f1] via-[#04bef1] to-[#0212f1]"}`}>

                                {/* AVATAR */}
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border text-[11px] font-bold sm:h-8 sm:w-8 sm:text-xs ${isDark ? "border-white/25 bg-white text-black" : "border-black/10 bg-black text-white"}`}>
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name || "User"}
                                            referrerPolicy="no-referrer"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                                e.currentTarget.parentElement.textContent = getInitials(user.name);
                                            }}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        getInitials(user.name)
                                    )}                </div>

                                {/* FIRST NAME */}
                                <span className={`hidden max-w-[100px] truncate text-sm font-semibold sm:block ${isDark ? "text-white" : "text-black"}`}>
                                    {getFirstName(user.name)}
                                </span>

                                <FaChevronDown className={`mr-1 text-[10px] transition-transform duration-300 ${open ? "rotate-180" : ""} ${isDark ? "text-white/70" : "text-black/60"}`} />
                            </button>

                            {/* ========================= USER POPUP ========================= */}
                            {open && (
                                <div className={`absolute right-0 top-[calc(100%+10px)] w-[250px] overflow-hidden rounded-[26px] p-2 effect-3d backdrop-blur-3xl transition-all duration-300 ${isDark
                                        ? "border-white/15 bg-gradient-to-b from-[#0e163d]/95 to-[#1c0f30]/95"
                                        : "border-indigo-100 bg-gradient-to-b from-[#f8fafc]/95 to-[#f1f5f9]/95"
                                    }`}>

                                    {/* User Profile Card Section */}
                                    <div className={`rounded-[20px] border p-3.5 ${isDark
                                            ? "border-white/5 bg-gradient-to-br from-white/10 via-transparent to-transparent"
                                            : "border-indigo-200/50 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent"
                                        }`}>
                                        <p className={`text-[12px] font-bold font-serif tracking-[0.18em] ${isDark ? "text-white/40" : "text-blue-700"}`}>
                                            Signed In As
                                        </p>

                                        <p className={`font-cookie tracking-widest text-3xl mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                                            {user.name}
                                        </p>

                                        <p className={`font-serif mt-0.5 truncate text-[14px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                            {user.email}
                                        </p>
                                    </div>

                                    {/* 3D Logout Button */}
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className={` font-cookie mt-2 flex w-full items-center gap-2.5 rounded-[20px] px-17 py-1 text-2xl tracking-wider effect-3d transition-all duration-300 ${isDark
                                                ? "border-white/10 bg-gradient-to-r from-[#581c87]/40 to-[#1e1b4b]/40 text-purple-200 hover:text-white hover:from-rose-500 hover:to-rose-600 hover:text-white"
                                                : "border-rose-200/60 bg-gradient-to-r from-rose-50/50 to-slate-100/50 text-rose-600 hover:bg-gradient-to-r hover:from-rose-500 hover:to-rose-600 hover:text-white hover:shadow-[0_8px_20px_-4px_rgba(244,63,94,0.3)] active:scale-[0.97]"
                                            }`}
                                    >
                                        <FaSignOutAlt className="text-[18px] transition-transform duration-300 group-hover:translate-x-0.5" />
                                        Logout
                                    </button>

                                </div>
                            )}


                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;