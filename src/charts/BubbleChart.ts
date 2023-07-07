import { Datum } from ".";
import { ColorMap } from "../colors";
import { Svg } from "../components";
import { BUBBLE, getPathData } from "../coords";
import { Dimensions, ResolvedDimensions } from "../dims";
import {
  BubbleInputStep,
  ChartType,
  ExtremeValue,
  InputGroupValue,
  TextDims,
} from "../types";
import { FONT_SIZE, deriveSubtlerColor, getTextColor } from "../utils";
import * as Chart from "./Chart";
import {
  STROKE_WIDTH,
  getGroupLabelStrokeWidth,
  getHierarchyRoot,
  getMaxValue,
  getRotate,
} from "./utils";

export type Info = Chart.BaseInfo & {
  type: "bubble";
  groups: InputGroupValue[];
  maxValue: ExtremeValue;
};

export const info = (
  svgBackgroundColor: string,
  inputStep: BubbleInputStep
): Info => {
  const { groups, shareDomain = false } = inputStep;
  const type: ChartType = "bubble";

  return {
    ...Chart.baseInfo(svgBackgroundColor, inputStep, shareDomain),
    type,
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
) => {
  const { groups, maxValue, shareDomain, showValues, svgBackgroundColor } =
    info;
  const {
    showDatumLabels,
    dims: { width, height, size, margin },
    textDims,
    colorMap,
    cartoonize,
  } = props;
  const root = getHierarchyRoot({ groups, size: maxValue.k * size });
  const groupsGetters: Chart.Getter[] = [];
  // If a custom maxValue was provided, we need to shift the bubbles to the center.
  const maxValueShift = maxValue.kc * size * 0.5;
  const showDatumLabelsAndValues = showDatumLabels && showValues;
  const groupFill = deriveSubtlerColor(svgBackgroundColor);
  const groupLabelFill = getTextColor(svgBackgroundColor);
  const groupLabelStroke = svgBackgroundColor;
  const datumStroke = svgBackgroundColor;

  for (const group of root.children ?? []) {
    const { key } = group.data;

    // Skip groups with no data.
    if (
      isNaN(group.r) ||
      group.children?.reduce((acc, d) => (acc += d.r), 0) === 0
    ) {
      continue;
    }

    const singleDatum = group.children?.length === 1;
    const groupX = margin.left + group.x + maxValueShift + (width - size) * 0.5;
    const groupY = margin.top + group.y + maxValueShift + (height - size) * 0.5;
    const groupGetters: Chart.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = s(
          BUBBLE,
          getPathData({
            type: "bubble",
            r: group.r,
            cartoonize,
          })
        );
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
          fill: groupFill,
          opacity,
        };
      },
      data: [],
    };

    for (const datum of group.children ?? []) {
      const { key, value, fill } = datum.data;
      const datumFill = fill ?? colorMap.get(key, group.data.key, shareDomain);
      const datumGetters: Datum.Getter = {
        key,
        type: "value",
        teleportKey: `${group.data.key}:${key}`,
        teleportFrom: datum.data.teleportFrom,
        value,
        g: ({ s, _g }) => {
          const d = s(
            BUBBLE,
            getPathData({
              type: "bubble",
              r: datum.r,
              cartoonize,
            })
          );
          const clipPath = d;
          const x = s(groupX, groupX + group.x - datum.x);
          const y = s(groupY, groupY + group.y - datum.y);
          const rotate = getRotate(_g?.rotate, cartoonize);
          const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
          const labelX = 0;
          const labelY =
            textDims.datumLabel.yShift -
            (showDatumLabelsAndValues ? textDims.datumLabel.height * 0.5 : 0);
          const labelFontSize = s(
            0,
            showDatumLabels ? FONT_SIZE.datumLabel : 0
          );
          const labelFill = getTextColor(datumFill);
          const labelStroke = datumFill;
          const valueX = 0;
          const valueY = s(
            0,
            (singleDatum && key
              ? datum.r * 0.5 + textDims.datumValue.yShift
              : textDims.datumValue.yShift) +
              (showDatumLabels ? textDims.datumLabel.height : 0) -
              (showDatumLabelsAndValues ? textDims.datumLabel.height * 0.5 : 0)
          );
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
