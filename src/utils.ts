import { HALF_FONT_K } from "./charts/utils";
import { Svg } from "./components";
import { InputStep, State, TextDims, TextType } from "./types";

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

export const min = (array: number[]): number | undefined => {
  return array.length === 0 ? undefined : Math.min(...array);
};

export const max = (array: number[]): number | undefined => {
  return array.length === 0 ? undefined : Math.max(...array);
};

export const sum = (array: number[]): number => {
  return array.reduce((acc, d) => acc + d, 0);
};

export const FONT_SIZE: Record<TextType, number> = {
  title: 24,
  subtitle: 14,
  legendTitle: 12,
  legendItem: 12,
  axisTitle: 12,
  axisTick: 11,
  groupLabel: 14,
  datumLabel: 11,
  datumValue: 11,
};

export const FONT_WEIGHT: Record<TextType, number> = {
  title: 700,
  subtitle: 400,
  legendTitle: 700,
  legendItem: 400,
  axisTitle: 400,
  axisTick: 400,
  groupLabel: 400,
  datumLabel: 600,
  datumValue: 400,
};

export const getTextDims = (svg: Svg): TextDims => {
  return Object.fromEntries(
    Object.entries(FONT_SIZE).map(([textType]) => {
      const { height } = svg.measureText("Ag", textType as TextType);
      return [textType, { height, yShift: -height * HALF_FONT_K }];
    })
  ) as TextDims;
};

export type TextWidths = Record<string, number>;

export const getTextWidths = (
  labels: (string | number)[],
  svg: Svg,
  textType: TextType
): TextWidths => {
  const widths: TextWidths = {};
  labels.forEach((label) => {
    const { width } = svg.measureText(label, textType);
    widths[label] = width;
  });

  return widths;
};

export const getDataValues = (step: InputStep): number[] => {
  switch (step.chartType) {
    case "bar":
    case "bubble":
    case "pie":
    case "treemap":
      return step.groups.flatMap((d) => d.data.map((d) => d.value));
    case "beeswarm":
      return step.groups.flatMap((d) => d.data.map((d) => d.position));
    case "scatter":
      return step.groups.flatMap((d) => d.data.flatMap((d) => [d.x, d.y]));
    default:
      const _exhaustiveCheck: never = step;
      return _exhaustiveCheck;
  }
};

export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

const getStateOrder = (state: State): 0 | 1 | 2 => {
  switch (state) {
    case "enter":
      return 1;
    case "update":
      return 2;
    case "exit":
      return 0;
  }
};

export const stateOrderComparator = <T extends { state: State }>(
  a: T,
  b: T
): number => {
  return getStateOrder(a.state) - getStateOrder(b.state);
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);

  return [r, g, b];
};

export const getTextColor = (hex: string): "white" | "black" => {
  const [r, g, b] = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? "black" : "white";
};

export const reverseTextColor = (
  color: "white" | "black"
): "white" | "black" => {
  return color === "white" ? "black" : "white";
};

export const brighten = (hex: string, percent: number): string => {
  const f = parseInt(hex.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;

  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
};

export const darken = (hex: string, percent: number): string => {
  return brighten(hex, percent * -1);
};

export const deriveSubtlerColor = (hex: string, k: number = 1): string => {
  const textColor = getTextColor(hex);
  return textColor === "white" ? brighten(hex, 0.2 * k) : darken(hex, 0.08 * k);
};
