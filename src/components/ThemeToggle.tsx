import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="text-sm font-semibold text-text-sub px-2">Appearance</h3>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={theme === "light" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("light")}
          className="flex flex-col gap-1 h-14"
        >
          <Sun className="h-4 w-4" />
          <span className="text-[10px]">Light</span>
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("dark")}
          className="flex flex-col gap-1 h-14"
        >
          <Moon className="h-4 w-4" />
          <span className="text-[10px]">Dark</span>
        </Button>
        <Button
          variant={theme === "system" ? "default" : "outline"}
          size="sm"
          onClick={() => setTheme("system")}
          className="flex flex-col gap-1 h-14"
        >
          <Monitor className="h-4 w-4" />
          <span className="text-[10px]">System</span>
        </Button>
      </div>
    </div>
  );
}
