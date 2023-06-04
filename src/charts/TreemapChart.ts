import {
  hierarchy,
  treemap,
  treemapBinary,
  treemapDice,
  treemapResquarify,
  treemapSlice,
  treemapSliceDice,
  treemapSquarify,
} from "d3-hierarchy";
import { ColorMap } from "../colors";
import { Datum, Svg } from "../components";
import { BAR, getPathData } from "../coords";
import { Dimensions, ResolvedDimensions } from "../dims";
import {
  BaseMax,
  InputGroupValue,
  TextDims,
  TreemapInputStep,
  TreemapLayout,
} from "../types";
import { FONT_SIZE, getTextColor, max } from "../utils";
import * as Chart from "./Chart";
import { TreemapHierarchyRoot } from "./types";
import {
  PADDING,
  STROKE_WIDTH,
  TEXT_MARGIN,
  getBaseMax,
  getGroupLabelStrokeWidth,
  getRotate,
} from "./utils";

export type Info = Chart.BaseInfo & {
  layout: TreemapLayout;
  groups: InputGroupValue[];
  maxValue: BaseMax;
};

export const info = (inputStep: TreemapInputStep): Info => {
  const { layout = "resquarify", groups, shareDomain = false } = inputStep;

  return {
    ...Chart.baseInfo(inputStep, shareDomain),
    layout,
    groups,
    maxValue: getMaxValue(inputStep),
  };
};

// TODO: Share between charts.
const getMaxValue = (step: TreemapInputStep): BaseMax => {
  const values = step.groups.flatMap((d) =>
    d.data.reduce((acc, d) => acc + d.value, 0)
  );
  const valueMax = max(values) ?? 0;

  return getBaseMax(step.valueScale?.maxValue, valueMax);
};

export const updateDims = (dims: Dimensions) => {
  const { BASE_MARGIN } = dims;
  dims.addBottom(BASE_MARGIN);
};

export const getters = (
  info: Info,
  props: {
    showValues: boolean;
    showDatumLabels: boolean;
    svg: Svg;
    dims: ResolvedDimensions;
    textDims: TextDims;
    colorMap: ColorMap;
    cartoonize: boolean;
  }
) => {
  const { layout, groups, maxValue, shareDomain } = info;
  const {
    showValues,
    showDatumLabels,
    svg,
    dims: { width, height, margin },
    textDims,
    colorMap,
    cartoonize,
  } = props;
  const root = getRoot({
    groups,
    width: maxValue.k * width,
    height: maxValue.k * height,
    layout,
  });
  const groupsGetters: Chart.Getter[] = [];

  for (const group of root.children || []) {
    const { key } = group.data;

    // Skip groups with no data.
    if (
      group.value === 0 ||
      group.children?.reduce((acc, d) => (acc += d.value), 0) === 0
    ) {
      continue;
    }

    const groupWidth = group.x1 - group.x0;
    const groupHeight = group.y1 - group.y0;

    const groupGetters: Chart.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = BAR;
        const x =
          margin.left + group.x0 + (maxValue.kc * width + groupWidth) * 0.5;
        const y =
          margin.top + group.y0 + (maxValue.kc * height + groupHeight) * 0.5;
        const labelX = 0;
        const labelY = textDims.groupLabel.yShift;
        const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
        const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
        const opacity = group.data.opacity ?? 1;

        return {
          d,
          x: s(x, null, _g?.x),
          y: s(y, null, _g?.y),
          labelX,
          labelY,
          labelFontSize,
          labelStrokeWidth,
          opacity,
        };
      },
      data: [],
    };

    for (const datum of group.children || []) {
      const { key, value, fill } = datum.data;
      const dWidth = datum.x1 - datum.x0;
      const dHeight = datum.y1 - datum.y0;
      const datumFill = fill ?? colorMap.get(key, group.data.key, shareDomain);

      const datumGetters: Datum.Getter = {
        key,
        type: "value",
        teleportKey: `${group.data.key}:${key}`,
        teleportFrom: datum.data.teleportFrom,
        value,
        g: ({ s, _g }) => {
          const d = s(
            BAR,
            getPathData({
              type: "bar",
              width: dWidth,
              height: dHeight,
              cartoonize,
            })
          );
          const clipPath = d;
          const x = s(0, datum.x0 - group.x0 - (groupWidth - dWidth) * 0.5);
          const y = s(0, datum.y0 - group.y0 - (groupHeight - dHeight) * 0.5);
          const rotate = getRotate(_g?.rotate);
          const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
          const labelWidth = svg.measureText(key, "datumLabel").width;
          const labelX = s(0, (labelWidth - dWidth) * 0.5 + TEXT_MARGIN);
          const labelY = s(0, -(dHeight * 0.5 + textDims.datumLabel.yShift));
          const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
          const labelFill = getTextColor(datumFill);
          const valueWidth = svg.measureText(value, "datumValue").width;
          const valueX = s(0, (valueWidth - dWidth) * 0.5 + TEXT_MARGIN);
          const valueY =
            labelY + (showDatumLabels ? textDims.datumValue.height : 0);
          const valueFontSize = showValues ? s(0, FONT_SIZE.datumValue) : 0;
          const valueFill = labelFill;
          const opacity = datum.data.opacity ?? 1;

          return {
            d,
            clipPath,
            x,
            y,
            rotate,
            fill: datumFill,
            strokeWidth,
            labelX,
            labelY,
            labelFontSize,
            labelFill,
            valueX,
            valueY,
            valueFontSize,
            valueFill,
            opacity,
          };
        },
      };

      groupGetters.data.push(datumGetters);
    }

    groupsGetters.push(groupGetters);
  }

  return groupsGetters;
};

const getRoot = ({
  groups,
  width,
  height,
  layout,
}: {
  groups: InputGroupValue[];
  width: number;
  height: number;
  layout: TreemapLayout;
}): TreemapHierarchyRoot => {
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
  treemap()
    .tile(getTile(layout))
    .size([width, height])
    .paddingInner(PADDING)
    .paddingOuter(PADDING)(root as any);

  return root as any as TreemapHierarchyRoot;
};

const getTile = (layout: TreemapLayout) => {
  switch (layout) {
    case "binary":
      return treemapBinary;
    case "dice":
      return treemapDice;
    case "slice":
      return treemapSlice;
    case "slice-dice":
      return treemapSliceDice;
    case "squarify":
      return treemapSquarify;
    case "resquarify":
      return treemapResquarify;
  }
};
