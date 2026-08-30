import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";

const Home = () => {
  const { isDark } = useTheme();

  return (
    <main className={`min-h-screen transition-all duration-500 ${isDark ? "bg-slate-900 border-slate-800/80" : "bg-white"}`}>
      <Navbar />
    </main>
  );
};

export default Home;