export const getFolderColor = (name = "") => {
    const key = name.toLowerCase();

    const map = {
        src: "text-sky-400",
        routes: "text-green-400",
        models: "text-red-400",
        controllers: "text-purple-400",
        middleware: "text-yellow-400",
        utils: "text-orange-400",
        components: "text-cyan-400",
        services: "text-pink-400",
        config: "text-gray-400",
        pages: "text-indigo-400",
        hooks: "text-violet-400",
        context: "text-teal-400",
        assets: "text-emerald-400",
        public: "text-blue-400",
        api: "text-lime-400",
        auth: "text-rose-400",
        database: "text-amber-400",
        db: "text-amber-400",
        middleware: "text-yellow-400",
        tests: "text-fuchsia-400",
        test: "text-fuchsia-400",
        docs: "text-slate-400",
    };

    return map[key] || "text-white";
};