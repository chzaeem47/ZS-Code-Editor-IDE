import Navbar from "../components/Navbar.jsx";
import FileTabsNavbar from "../components/FileTabsNavbar.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import LeftSideBar from "../components/LeftSideBar.jsx";
import Editor from "../components/Editor.jsx";
import Preview from "../components/Preview.jsx";
import {
  WorkspaceProvider,
  useWorkspace,
} from "../context/WorkspaceContext.jsx";

const WorkspaceArea = () => {
  const { isDark } = useTheme();
  const { viewMode } = useWorkspace();

  return (
    <div
      className={`fixed bottom-[12px] left-[435px] right-[10px] top-[120px] z-10 overflow-hidden rounded-xl border ${
        isDark
          ? "border-white/15 bg-[#0d1117]"
          : "border-black/10 bg-white"
      }`}
    >
      {viewMode === "preview" ? (
        <Preview />
      ) : (
        <Editor/>
      )}
    </div>
  );
};

const Home = () => {
  const { isDark } = useTheme();

  return (
    <WorkspaceProvider>
      <main
        className={`min-h-screen transition-all duration-500 ${
          isDark
            ? "bg-slate-900 border-slate-800/80"
            : "bg-white"
        }`}
      >
        <Navbar />
        <FileTabsNavbar />
        <LeftSideBar />
        <WorkspaceArea />
      </main>
    </WorkspaceProvider>
  );
};

export default Home;