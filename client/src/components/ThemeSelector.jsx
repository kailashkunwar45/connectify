import { useThemeStore } from "../store/useThemeStore.js";
import { Palette } from "lucide-react";
import { THEMES } from "../constants";

const ThemeSelector = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      
      <button tabIndex={0} className="btn btn-ghost btn-circle">
        <Palette className="w-6 h-6 text-base-content opacity-70" />
      </button>

      <div className="dropdown-content mt-2 p-2 shadow-2xl bg-base-200 rounded-2xl w-56 border border-base-content/10 max-h-80 overflow-y-auto">
        <div className="space-y-1">
          {THEMES.map((themeOption) => (
            <button
              key={themeOption.name}
              className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
                theme === themeOption.name
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-content/5 text-base-content"
              }`}
              onClick={() => setTheme(themeOption.name)}
            >
              <Palette className="w-5 h-5" />

              <span className="text-sm font-medium">
                {themeOption.label}
              </span>

              <div className="ml-auto flex gap-1">
                {themeOption.colors.map((color, i) => (
                  <span
                    key={i}
                    style={{ backgroundColor: color }}
                    className="size-2 rounded-full"
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
