// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { lightTheme, darkTheme } from "../assets/styles/theme";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // const savedTheme = localStorage.getItem("theme");
    // if (savedTheme) {
    //   return savedTheme;
    // }
    // if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    //   return "dark";
    // }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));

  const setLightTheme = () => setTheme("light");
  const setDarkTheme = () => setTheme("dark");

  // Pilih theme object sesuai state
  const colors = theme === "dark" ? darkTheme : lightTheme;

  const value = {
    theme,
    colors, // <---- tambahin ini
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
