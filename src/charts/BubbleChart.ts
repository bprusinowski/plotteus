import { Datum } from ".";
import * as Story from "..";
import { BUBBLE, getPathData } from "../coords";
import { Dimensions } from "../dims";
import {
  BubbleInputStep,
  ChartType,
  ExtremeValue,
  InputGroupValue,
} from "../types";
import { FONT_SIZE, deriveSubtlerColor, getTextColor } from "../utils";
import * as Chart from "./Chart";
import {
  HALF_FONT_K,
  STROKE_WIDTH,
  getGroupLabelStrokeWidth,
  getHierarchyRoot,
  getMaxValue,
  getRotate,
} from "./utils";

export type Info = Story.Info &
  Chart.BaseInfo & {
    type: "bubble";
    groups: InputGroupValue[];
    maxValue: ExtremeValue;
  };

export const info = (
  storyInfo: Story.Info,
  svgBackgroundColor: string,
  inputStep: BubbleInputStep
): Info => {
  const { groups, shareDomain = false } = inputStep;
  const type: ChartType = "bubble";

  return {
    ...storyInfo,
    ...Chart.baseInfo(svgBackgroundColor, inputStep, shareDomain),
    type,
    groups,
    maxValue: getMaxValue(inputStep),
  };
};

export const xExtent = (): Chart.Extent => {
  return;
};

export const yExtent = (): Chart.Extent => {
  return;
};

export const updateDims = (dims: Dimensions) => {
  const { BASE_MARGIN } = dims;
  dims.addBottom(BASE_MARGIN);
};

export const getters = (
  info: Info,
  props: Chart.GetterProps
): Chart.Getter[] => {
  const { groups, maxValue, shareDomain, showValues, svgBackgroundColor } =
    info;
  const { showDatumLabels, dims, textTypeDims, colorMap, cartoonize } = props;
  const { width, height, size, margin } = dims;
  const root = getHierarchyRoot({ groups, size: maxValue.k * size });
  // If a custom maxValue was provided, we need to shift the bubbles to the center.
  const maxValueShift = maxValue.kc * size * 0.5;
  const showDatumLabelsAndValues = showDatumLabels && showValues;
  const groupFill = deriveSubtlerColor(svgBackgroundColor);
  const groupLabelFill = getTextColor(svgBackgroundColor);
  const groupLabelStroke = svgBackgroundColor;
  const datumStroke = groupFill;

  return (root.children ?? [])
    .filter((group) => {
      // Skip groups with no data.
      return !(
        isNaN(group.r) ||
        group.children?.reduce((acc, d) => (acc += d.r), 0) === 0
      );
    })
    .map((group) => {
      const { key } = group.data;
      const singleDatum = group.children?.length === 1;
      const groupX =
        margin.left + group.x + maxValueShift + (width - size) * 0.5;
      const groupY =
        margin.top + group.y + maxValueShift + (height - size) * 0.5;
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
          const labelY = groupY - textTypeDims.groupLabel.yShift * HALF_FONT_K;
          const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
          const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
          const opacity = group.data.opacity ?? 1;

          const g: Chart.G = {
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

          return g;
        },
        data: [],
      };

      for (const datum of group.children ?? []) {
        const { key, value, fill } = datum.data;
        const datumFill =
          fill ?? colorMap.get(key, group.data.key, shareDomain);
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
              -textTypeDims.datumLabel.yShift * 0.5 -
              (showDatumLabelsAndValues ? -textTypeDims.datumLabel.yShift : 0);
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
                ? datum.r * 0.5 - textTypeDims.datumValue.yShift * 0.5
                : -textTypeDims.datumValue.yShift * 0.5) +
                (showDatumLabels ? textTypeDims.datumLabel.height : 0) -
                (showDatumLabelsAndValues
                  ? -textTypeDims.datumLabel.yShift * 1.25
                  : 0)
            );
            const valueFontSize = showValues ? s(0, FONT_SIZE.datumValue) : 0;
            const valueFill = labelFill;
            const opacity = datum.data.opacity ?? 1;

            const g: Datum.G = {
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

            return g;
          },
        };

        groupGetters.data.push(datumGetters);
      }

      return groupGetters;
    });
};
