import {
  SimulationNodeDatum,
  forceCollide,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import { hierarchy, pack } from "d3-hierarchy";
import {
  BubbleInputStep,
  ExtremeValue,
  InputDatumPosition,
  InputGroupValue,
  Layout,
  PieInputStep,
  TreemapInputStep,
} from "../types";
import { max } from "../utils";
import { HierarchyRoot } from "./types";

// 0.5 seems too much.
export const HALF_FONT_K = 0.425;

export const TEXT_MARGIN = 8;

export const PADDING = 4;

export const STROKE_WIDTH = 1;

export const getExtremeValue = (
  scaleExtreme: number | undefined,
  dataExtreme: number
): ExtremeValue => {
  const k = scaleExtreme ? dataExtreme / scaleExtreme : 1;

  return {
    data: dataExtreme,
    scale: scaleExtreme,
    actual: scaleExtreme ?? dataExtreme,
    k,
    kc: 1 - k,
  };
};

export const getMaxValue = (
  step: BubbleInputStep | PieInputStep | TreemapInputStep
): ExtremeValue => {
  const values = step.groups.flatMap((group) =>
    group.data.reduce((acc, d) => acc + d.value, 0)
  );
  const valueMax = max(values) ?? 0;

  return getExtremeValue(step.valueScale?.maxValue, valueMax);
};

export const getRotate = (_rotate = 0, cartoonize?: boolean): number => {
  const rotate = _rotate <= -90 ? -180 : _rotate <= 90 ? 0 : 180;

  return rotate + (cartoonize ? Math.random() * 20 - 10 : 0);
};

export const getGroupLabelStrokeWidth = (labelFontSize: number): number => {
  return labelFontSize ? 3 : 0;
};

export const getHierarchyRoot = ({
  groups,
  size,
}: {
  groups: InputGroupValue[];
  size: number;
}): HierarchyRoot => {
  const root = hierarchy({
    children: groups.map((group) => ({
      key: group.key,
      opacity: group.opacity,
      children: group.data,
    })),
  }).sum((group) => Math.max(0, (group as any).value));
  const descendants = root.descendants();
  const leaves = descendants.filter((d) => !d.children);
  leaves.forEach((d: any, i) => (d.index = i));
  root.sort((a: any, b: any) => a.index - b.index);
  pack().size([size, size]).padding(PADDING)(root as any);

  return root as any as HierarchyRoot;
};

type ForceAlignedPositions = Record<string, ForceAlignedPosition>;

type ForceAlignedPosition = {
  key: string;
  x: number;
  y: number;
  r: number;
};

export const getForceAlignedPositions = (
  data: InputDatumPosition[],
  layout: Layout,
  groupX: number,
  groupY: number,
  xScale: (d: number) => number,
  yScale: (d: number) => number
): ForceAlignedPositions => {
  const positions: ForceAlignedPosition[] = [];
  const [x, y, xForce, yForce] =
    layout === "horizontal"
      ? ["x", "y", forceX, forceY]
      : ["y", "x", forceY, forceX];

  for (const datum of data) {
    const position = {
      key: datum.key,
      x: groupX + xScale(datum.position),
      y: groupY + yScale(datum.position),
      r: 4,
    };
    positions.push(position);
  }

  forceSimulation(positions)
    // @ts-ignore
    .force("x", xForce((d) => (d as any)[x]).strength(0.7))
    // @ts-ignore
    .force("y", yForce((d) => (d as any)[y]).strength(0.075))
    .force(
      "collide",
      forceCollide<{ key: string; r: number } & SimulationNodeDatum>()
        .radius((d) => d.r + 1)
        .iterations(3)
    )
    .tick(30)
    .stop();

  return positions.reduce((acc, d) => {
    acc[d.key] = d;

    return acc;
  }, {} as ForceAlignedPositions);
};
