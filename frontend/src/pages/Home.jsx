import Navbar from "../components/Navbar.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import LeftSideBar from "../components/LeftSideBar.jsx";

const Home = () => {
  const { isDark } = useTheme();

  return (
    <main className={`min-h-screen transition-all duration-500 ${isDark ? "bg-slate-900 border-slate-800/80" : "bg-white"}`}>
      <Navbar />
      <LeftSideBar/>
    </main>
  );
};

export default Home;