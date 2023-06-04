import { hierarchy, pack } from "d3-hierarchy";
import {
  BaseMax,
  BubbleInputStep,
  InputGroupValue,
  PieInputStep,
  TreemapInputStep,
} from "../types";
import { max } from "../utils";
import { HierarchyRoot } from "./types";

// 0.5 seems too much.
export const HALF_FONT_K = 0.42;

export const TEXT_MARGIN = 8;

export const PADDING = 4;

export const STROKE_WIDTH = 1;

export const getBaseMax = (
  scaleMax: number | undefined,
  dataMax: number
): BaseMax => {
  const k = scaleMax ? dataMax / scaleMax : 1;

  return {
    data: dataMax,
    scale: scaleMax,
    actual: scaleMax ?? dataMax,
    k,
    kc: 1 - k,
  };
};

export const getMaxValue = (
  step: BubbleInputStep | PieInputStep | TreemapInputStep
): BaseMax => {
  const values = step.groups.flatMap((d) =>
    d.data.reduce((acc, d) => acc + d.value, 0)
  );
  const valueMax = max(values) ?? 0;

  return getBaseMax(step.valueScale?.maxValue, valueMax);
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
    children: groups.map((d) => ({
      key: d.key,
      opacity: d.opacity,
      children: d.data,
    })),
  }).sum((d) => Math.max(0, (d as any).value));
  const descendants = root.descendants();
  const leaves = descendants.filter((d) => !d.children);
  leaves.forEach((d: any, i) => (d.index = i));
  root.sort((a: any, b: any) => a.index - b.index);
  pack().size([size, size]).padding(PADDING)(root as any);

  return root as any as HierarchyRoot;
};
