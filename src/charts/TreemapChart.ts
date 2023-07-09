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
import { Datum } from ".";
import * as Story from "..";
import { ColorMap } from "../colors";
import { Svg } from "../components";
import { BAR, getPathData } from "../coords";
import { Dimensions, ResolvedDimensions } from "../dims";
import {
  ChartType,
  ExtremeValue,
  InputGroupValue,
  TextDims,
  TreemapInputStep,
  TreemapLayout,
} from "../types";
import { FONT_SIZE, deriveSubtlerColor, getTextColor } from "../utils";
import * as Chart from "./Chart";
import { TreemapHierarchyRoot } from "./types";
import {
  PADDING,
  STROKE_WIDTH,
  TEXT_MARGIN,
  getGroupLabelStrokeWidth,
  getMaxValue,
  getRotate,
} from "./utils";

export type Info = Story.Info &
  Chart.BaseInfo & {
    type: "treemap";
    layout: TreemapLayout;
    groups: InputGroupValue[];
    maxValue: ExtremeValue;
  };

export const info = (
  storyInfo: Story.Info,
  svgBackgroundColor: string,
  inputStep: TreemapInputStep
): Info => {
  const { layout = "resquarify", groups, shareDomain = false } = inputStep;
  const type: ChartType = "treemap";

  return {
    ...storyInfo,
    ...Chart.baseInfo(svgBackgroundColor, inputStep, shareDomain),
    type,
    layout,
    groups,
    maxValue: getMaxValue(inputStep),
  };
};

export const updateDims = (dims: Dimensions) => {
  const { BASE_MARGIN } = dims;
  dims.addBottom(BASE_MARGIN);
};

export const getters = (
  info: Info,
  props: {
    showDatumLabels: boolean;
    svg: Svg;
    dims: ResolvedDimensions;
    textDims: TextDims;
    colorMap: ColorMap;
    cartoonize: boolean;
  }
): Chart.Getter[] => {
  const {
    layout,
    groups,
    maxValue,
    shareDomain,
    showValues,
    svgBackgroundColor,
    datumLabelWidths,
    datumValueWidths,
  } = info;
  const {
    showDatumLabels,
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
  const groupFill = deriveSubtlerColor(svgBackgroundColor);
  const groupLabelFill = getTextColor(svgBackgroundColor);
  const groupLabelStroke = svgBackgroundColor;
  const datumStroke = svgBackgroundColor;

  for (const group of root.children ?? []) {
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

    const groupX =
      margin.left + group.x0 + (maxValue.kc * width + groupWidth) * 0.5;
    const groupY =
      margin.top + group.y0 + (maxValue.kc * height + groupHeight) * 0.5;
    const groupGetters: Chart.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = BAR;
        const labelX = groupX;
        const labelY = groupY + textDims.groupLabel.yShift;
        const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
        const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
        const opacity = group.data.opacity ?? 1;

        return {
          d,
          x: s(groupX, null, _g?.x),
          y: s(groupY, null, _g?.y),
          labelX,
          labelY,
          labelFontSize,
          labelStroke: groupLabelStroke,
          labelStrokeWidth,
          labelFill: groupLabelFill,
          labelRotate: 0,
          fill: groupFill,
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
          const x = s(
            groupX,
            groupX + datum.x0 - group.x0 - (groupWidth - dWidth) * 0.5
          );
          const y = s(
            groupY,
            groupY + datum.y0 - group.y0 - (groupHeight - dHeight) * 0.5
          );
          const rotate = getRotate(_g?.rotate);
          const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
          const labelWidth = datumLabelWidths[key];
          const labelX = s(0, (labelWidth - dWidth) * 0.5 + TEXT_MARGIN);
          const labelY = s(0, -(dHeight * 0.5 + textDims.datumLabel.yShift));
          const labelFontSize = s(
            0,
            showDatumLabels ? FONT_SIZE.datumLabel : 0
          );
          const labelFill = getTextColor(datumFill);
          const labelStroke = datumFill;
          const valueWidth = datumValueWidths[value.toString()];
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
            stroke: datumStroke,
            strokeWidth,
            labelX,
            labelY,
            labelFontSize,
            labelStroke,
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
