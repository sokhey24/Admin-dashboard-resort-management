import { theme as antTheme } from "antd";
import { ANT_PRIMARY_DARK, ANT_PRIMARY_LIGHT, BRAND } from "./brandTokens";

/**
 * Unified Ant Design 6 theme tokens aligned with Tailwind luxury palette.
 */
export function getAntdTheme(darkMode) {
  const { surface, card, border } = BRAND;

  return {
    algorithm: darkMode ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: darkMode ? ANT_PRIMARY_DARK : ANT_PRIMARY_LIGHT,
      borderRadius: 10,
      colorBgLayout: darkMode ? surface.dark : surface.light,
      colorBgContainer: darkMode ? card.dark : card.light,
      colorBorder: darkMode ? border.dark : border.light,
      colorText: darkMode ? "#f1f5f9" : "#0f172a",
      colorTextSecondary: darkMode ? "#94a3b8" : "#64748b",
      fontFamily: '"Kantumruy Pro", Inter, system-ui, sans-serif',
    },
    components: {
      Menu: {
        darkItemBg: "transparent",
        darkSubMenuItemBg: "transparent",
        itemBorderRadius: 8,
        itemMarginInline: 8,
        itemHeight: 40,
      },
      Table: {
        headerBg: darkMode ? "rgba(30, 41, 59, 0.5)" : surface.light,
        headerColor: darkMode ? "#e2e8f0" : "#334155",
        borderColor: darkMode ? border.dark : border.light,
        borderRadius: 10,
        cellPaddingBlock: 12,
        cellPaddingInline: 16,
      },
      Card: {
        borderRadiusLG: 12,
        colorBorderSecondary: darkMode ? border.dark : border.light,
      },
      Modal: {
        borderRadiusLG: 12,
        contentBg: darkMode ? card.dark : card.light,
        headerBg: darkMode ? card.dark : card.light,
      },
      Button: {
        borderRadius: 10,
        primaryShadow: "0 2px 0 rgba(15, 42, 74, 0.08)",
      },
      Select: {
        borderRadius: 10,
        colorBorder: darkMode ? border.dark : border.light,
      },
      DatePicker: {
        borderRadius: 10,
        colorBorder: darkMode ? border.dark : border.light,
      },
      Tabs: {
        borderRadius: 10,
        itemSelectedColor: darkMode ? ANT_PRIMARY_DARK : ANT_PRIMARY_LIGHT,
        inkBarColor: darkMode ? ANT_PRIMARY_DARK : BRAND.accent,
      },
    },
  };
}

export const SIDER_BG = BRAND.deep;
export const SIDER_BG_COLLAPSED = BRAND.navy;
