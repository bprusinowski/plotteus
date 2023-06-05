import { HALF_FONT_K } from "./charts/utils";
import { Svg } from "./components";
import { State, TextDims, TextType } from "./types";

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
      const { height } = svg.measureText("Text", textType as TextType);
      return [textType, { height, yShift: -height * HALF_FONT_K }];
    })
  ) as TextDims;
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

export const getTextColor = (hex: string): "white" | "black" => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? "black" : "white";
};
