import { useDarkMode } from "../../util/DarkModeContext";

/** Shared surface tokens for CMS field panels (light / dark). */
export function useCmsTheme() {
  const dark = useDarkMode();

  return {
    dark,
    pageMuted: dark ? "text-gray-400" : "text-[#829AB1]",
    label: dark ? "text-gray-400" : "text-[#486581]",
    title: dark ? "text-gray-100" : "text-[#102A43]",
    panel:
      "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm",
    sectionDivider: dark ? "border-gray-700" : "border-gray-200",
    mediaPreview: dark
      ? "border-gray-600 bg-gray-900/60"
      : "border-[#D9E2EC] bg-[#F5F8FC]",
    inputClass: dark
      ? "!bg-gray-900/50 !border-gray-600 !text-gray-100 placeholder:!text-gray-500"
      : "!bg-white !border-[#D9E2EC] !text-gray-900",
  };
}
