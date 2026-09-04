import { useMemo } from "react";
import { FaDesktop } from "react-icons/fa";

import { useTheme } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";

const getExtension = (file) => {
  return (
    file?.extension ||
    file?.name?.split(".").pop() ||
    ""
  ).toLowerCase();
};

const Preview = () => {
  const { isDark } = useTheme();

  const {
    activeFile,
    openFiles,
  } = useWorkspace();

  const previewDocument =
    useMemo(() => {
      if (
        !activeFile ||
        !["html", "htm"].includes(
          getExtension(activeFile)
        )
      ) {
        return "";
      }

      const css = openFiles
        .filter((file) =>
          [
            "css",
            "scss",
            "sass",
          ].includes(
            getExtension(file)
          )
        )
        .map(
          (file) =>
            `\n/* ${file.name} */\n${
              file.content || ""
            }`
        )
        .join("\n");

      const javascript =
        openFiles
          .filter((file) =>
            [
              "js",
              "mjs",
              "cjs",
            ].includes(
              getExtension(file)
            )
          )
          .map(
            (file) =>
              `\n/* ${file.name} */\n${
                file.content || ""
              }`
          )
          .join("\n");

      const styleTag = css
        ? `<style data-zs-code-injected="true">${css}</style>`
        : "";

      const scriptTag = javascript
        ? `<script data-zs-code-injected="true">${javascript}<\\/script>`
        : "";

      let html =
        activeFile.content ||
        "";

      if (/<\/head>/i.test(html)) {
        html = html.replace(
          /<\/head>/i,
          `${styleTag}</head>`
        );
      } else {
        html =
          `${styleTag}${html}`;
      }

      if (/<\/body>/i.test(html)) {
        html = html.replace(
          /<\/body>/i,
          `${scriptTag}</body>`
        );
      } else {
        html =
          `${html}${scriptTag}`;
      }

      return html;
    }, [activeFile, openFiles]);

  if (!activeFile) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${
          isDark
            ? "bg-[#0d1117] text-white/30"
            : "bg-white text-slate-400"
        }`}
      >
        <div className="text-center">
          <FaDesktop className="mx-auto mb-4 text-4xl opacity-40" />

          <p className="text-sm">
            Open an HTML file to preview it.
          </p>
        </div>
      </div>
    );
  }

  if (
    !["html", "htm"].includes(
      getExtension(activeFile)
    )
  ) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${
          isDark
            ? "bg-[#0d1117] text-white/35"
            : "bg-white text-slate-400"
        }`}
      >
        <div className="text-center">
          <FaDesktop className="mx-auto mb-4 text-4xl opacity-40" />

          <p className="text-sm">
            Preview is available for HTML files.
          </p>

          <p className="mt-1 text-xs opacity-60">
            Active file:{" "}
            {activeFile.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white">
      <iframe
        title="ZS CODE Preview"
        srcDoc={
          previewDocument
        }
        sandbox="allow-scripts allow-forms allow-modals"
        className="h-full w-full border-0"
      />
    </div>
  );
};

export default Preview;