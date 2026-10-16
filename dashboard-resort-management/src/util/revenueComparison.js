import dayjs from "dayjs";

/**
 * Derives the previous-period filter matching the active DateFilter shape.
 * Returns null previousFilter when no comparable period (e.g. all-time view).
 */
export function getPreviousPeriodFilter(filter) {
  if (filter?.date) {
    const prev = dayjs(filter.date).subtract(1, "day");
    return {
      periodType: "day",
      previousFilter: { date: prev.format("YYYY-MM-DD"), month: null, year: null },
      periodLabel: "vs previous day",
    };
  }

  if (filter?.month && filter?.year) {
    const prev = dayjs(`${filter.year}-${String(filter.month).padStart(2, "0")}-01`).subtract(1, "month");
    return {
      periodType: "month",
      previousFilter: { date: null, month: prev.month() + 1, year: prev.year() },
      periodLabel: "vs previous month",
    };
  }

  if (filter?.year && !filter?.month) {
    return {
      periodType: "year",
      previousFilter: { date: null, month: null, year: Number(filter.year) - 1 },
      periodLabel: "vs previous year",
    };
  }

  return {
    periodType: null,
    previousFilter: null,
    periodLabel: null,
  };
}

/**
 * Period-over-period revenue comparison (paid revenue totals).
 */
export function getRevenueComparison(currentRevenue, previousRevenue) {
  const current = Number(currentRevenue) || 0;
  const previous = Number(previousRevenue) || 0;
  const difference = current - previous;

  if (previous === 0 && current === 0) {
    return {
      current,
      previous,
      difference: 0,
      percentage: 0,
      direction: "unchanged",
      tone: "neutral",
      displayPercentage: "0.0%",
      displayHeadline: "→ 0.0%",
      isNewRevenue: false,
    };
  }

  if (previous === 0 && current > 0) {
    return {
      current,
      previous,
      difference,
      percentage: null,
      direction: "new",
      tone: "positive",
      displayPercentage: null,
      displayHeadline: "↑ New revenue",
      isNewRevenue: true,
    };
  }

  const percentage = (difference / previous) * 100;
  const rounded = Math.round(percentage * 10) / 10;

  if (difference === 0) {
    return {
      current,
      previous,
      difference: 0,
      percentage: 0,
      direction: "unchanged",
      tone: "neutral",
      displayPercentage: "0.0%",
      displayHeadline: "→ 0.0%",
      isNewRevenue: false,
    };
  }

  if (difference > 0) {
    const signed = `+${formatPct(rounded)}%`;
    return {
      current,
      previous,
      difference,
      percentage: rounded,
      direction: "increase",
      tone: "positive",
      displayPercentage: signed,
      displayHeadline: `↑ ${signed}`,
      isNewRevenue: false,
    };
  }

  const signed = `${formatPct(rounded)}%`;
  return {
    current,
    previous,
    difference,
    percentage: rounded,
    direction: "decrease",
    tone: "negative",
    displayPercentage: signed,
    displayHeadline: `↓ ${signed}`,
    isNewRevenue: false,
  };
}

function formatPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.0";
  return n.toFixed(1);
}

export function buildComparisonTooltip(comparison, periodLabel) {
  if (!comparison || !periodLabel) return "";
  const { difference, direction, current, previous } = comparison;
  const absDiff = Math.abs(difference);
  const formattedDiff = `$${absDiff.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  if (direction === "new") {
    return `New paid revenue of $${Number(current).toLocaleString()} ${periodLabel.replace(/^vs /, "compared with ")}.`;
  }
  if (direction === "unchanged") {
    return `Paid revenue unchanged ${periodLabel.replace(/^vs /, "compared with ")}.`;
  }
  if (direction === "increase") {
    return `Revenue increased by ${formattedDiff} ${periodLabel.replace(/^vs /, "compared with ")} (previous: $${Number(previous).toLocaleString()}).`;
  }
  return `Revenue decreased by ${formattedDiff} ${periodLabel.replace(/^vs /, "compared with ")} (previous: $${Number(previous).toLocaleString()}).`;
}

export function comparisonAriaLabel(comparison, periodLabel) {
  if (!comparison?.displayHeadline) return undefined;
  const base = periodLabel ? periodLabel.replace(/^vs /, "compared with the ") : "";
  if (comparison.direction === "new") {
    return `Revenue is new ${base}.`;
  }
  if (comparison.direction === "unchanged") {
    return `Revenue unchanged, 0 percent ${base}.`;
  }
  if (comparison.direction === "increase") {
    return `Revenue increased by ${Math.abs(comparison.percentage ?? 0)} percent ${base}.`;
  }
  if (comparison.direction === "decrease") {
    return `Revenue decreased by ${Math.abs(comparison.percentage ?? 0)} percent ${base}.`;
  }
  return undefined;
}
