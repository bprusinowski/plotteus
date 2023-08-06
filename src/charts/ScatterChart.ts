import { ScaleLinear, scaleLinear } from "d3-scale";
import { Datum } from ".";
import * as Story from "..";
import { BAR, getPathData } from "../coords";
import { Dimensions } from "../dims";
import {
  ChartType,
  ExtremeValue,
  InputAxis,
  InputGroupXY,
  ScatterInputStep,
} from "../types";
import {
  FONT_SIZE,
  deriveSubtlerColor,
  getTextColor,
  max,
  min,
} from "../utils";
import * as Chart from "./Chart";
import {
  STROKE_WIDTH,
  getExtremeValue,
  getGroupLabelStrokeWidth,
  getRotate,
} from "./utils";

export type Info = Story.Info &
  Chart.BaseInfo & {
    type: "scatter";
    groups: InputGroupXY[];
    minValue: {
      x: ExtremeValue;
      y: ExtremeValue;
    };
    maxValue: {
      x: ExtremeValue;
      y: ExtremeValue;
    };
    verticalAxis: InputAxis | undefined;
    horizontalAxis: InputAxis | undefined;
  };

export const info = (
  storyInfo: Story.Info,
  svgBackgroundColor: string,
  inputStep: ScatterInputStep
): Info => {
  const { groups, shareDomain = false } = inputStep;
  const type: ChartType = "scatter";
  const xValues = groups.flatMap((d) => d.data.map((d) => d.x));
  const yValues = groups.flatMap((d) => d.data.map((d) => d.y));
  const minValue = getMinValue(xValues, yValues, inputStep);
  const maxValue = getMaxValue(xValues, yValues, inputStep);

  return {
    ...storyInfo,
    ...Chart.baseInfo(svgBackgroundColor, inputStep, shareDomain),
    type,
    groups,
    minValue,
    maxValue,
    verticalAxis: inputStep.verticalAxis,
    horizontalAxis: inputStep.horizontalAxis,
  };
};

export const xExtent = (inputStep: ScatterInputStep): Chart.Extent => {
  const { groups } = inputStep;
  const xValues = groups.flatMap((d) => d.data.map((d) => d.x));
  const yValues = groups.flatMap((d) => d.data.map((d) => d.y));
  const minValue = getMinValue(xValues, yValues, inputStep);
  const maxValue = getMaxValue(xValues, yValues, inputStep);

  return [minValue.x.actual, maxValue.x.actual];
};

export const yExtent = (inputStep: ScatterInputStep): Chart.Extent => {
  const { groups } = inputStep;
  const xValues = groups.flatMap((d) => d.data.map((d) => d.x));
  const yValues = groups.flatMap((d) => d.data.map((d) => d.y));
  const minValue = getMinValue(xValues, yValues, inputStep);
  const maxValue = getMaxValue(xValues, yValues, inputStep);

  return [minValue.y.actual, maxValue.y.actual];
};

const getMinValue = (
  xValues: number[],
  yValues: number[],
  step: ScatterInputStep
): {
  x: ExtremeValue;
  y: ExtremeValue;
} => {
  const xMin = min(xValues) ?? 0;
  const yMin = min(yValues) ?? 0;

  return {
    x: getExtremeValue(step.xScale?.minValue, xMin),
    y: getExtremeValue(step.yScale?.minValue, yMin),
  };
};

const getMaxValue = (
  xValues: number[],
  yValues: number[],
  step: ScatterInputStep
): {
  x: ExtremeValue;
  y: ExtremeValue;
} => {
  const xMax = max(xValues) ?? 0;
  const yMax = max(yValues) ?? 0;

  return {
    x: getExtremeValue(step.xScale?.maxValue, xMax),
    y: getExtremeValue(step.yScale?.maxValue, yMax),
  };
};

export const updateDims = (dims: Dimensions) => {
  const { BASE_MARGIN } = dims;
  dims.addTop(BASE_MARGIN).addBottom(BASE_MARGIN);
};

export const getters = (
  info: Info,
  props: Chart.GetterProps
): Chart.Getter[] => {
  const {
    groups,
    minValue: { x: xMinValue, y: yMinValue },
    maxValue: { x: xMaxValue, y: yMaxValue },
    shareDomain,
    svgBackgroundColor,
  } = info;
  const {
    showDatumLabels,
    dims: { width, height, margin, BASE_MARGIN },
    colorMap,
    cartoonize,
    textTypeDims,
  } = props;
  const { xScale, yScale } = getScales({
    xMinValue,
    xMaxValue,
    yMinValue,
    yMaxValue,
    width,
    height,
  });
  const groupsGetters: Chart.Getter[] = [];
  const groupFill = deriveSubtlerColor(svgBackgroundColor);
  const groupLabelFill = getTextColor(svgBackgroundColor);
  const groupLabelStroke = svgBackgroundColor;
  const datumStroke = svgBackgroundColor;

  for (const group of groups) {
    const { key } = group;
    const allX = group.data.map((d) => d.x);
    const allY = group.data.map((d) => d.y);
    const minX = xScale(min(allX) ?? 0);
    const maxX = xScale(max(allX) ?? 0);
    const minY = yScale(min(allY) ?? 0);
    const maxY = yScale(max(allY) ?? 0);
    const halfXExtent = (maxX - minX) * 0.5;
    const halfYExtent = (maxY - minY) * 0.5;
    const yExtent = maxY - minY;
    const groupX = margin.left + halfXExtent + minX;
    const groupY = margin.top + halfYExtent + minY;
    const groupGetters: Chart.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = BAR;
        const labelX = groupX;
        const labelY = groupY + BASE_MARGIN;
        const labelFontSize = 0;
        const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
        const opacity = group.opacity ?? 1;

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

    for (const datum of group.data) {
      const { key, x, y, fill } = datum;

      const datumX = groupX + xScale(x) - halfXExtent - minX;
      const datumY = groupY + yScale(y) - halfYExtent - minY;
      const datumFill = fill ?? colorMap.get(key, group.key, shareDomain);
      const datumGetters: Datum.Getter = {
        key,
        type: "xy",
        xValue: x,
        yValue: y,
        teleportKey: `${group.key}:${key}`,
        teleportFrom: datum.teleportFrom,
        g: ({ s, _g }) => {
          const d = s(
            BAR,
            getPathData({
              type: "bubble",
              r: 4,
              cartoonize,
            })
          );
          const clipPath = getPathData({
            type: "bar",
            width,
            height,
            cartoonize,
          });
          const x = s(groupX, datumX);
          const y = s(groupY, datumY);
          const rotate = getRotate(_g?.rotate);
          const strokeWidth = s(0, STROKE_WIDTH);
          const labelX = 0;
          const labelY = -textTypeDims.datumLabel.yShift * 2;
          const labelFontSize = s(
            0,
            showDatumLabels ? FONT_SIZE.datumLabel : 0
          );
          const labelFill = groupLabelFill;
          const labelStroke = svgBackgroundColor;
          const valueX = 0;
          const valueY = 0;
          const valueFontSize = 0;
          const valueFill = "black";
          const opacity = datum.opacity ?? 1;

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

    groupsGetters.push(groupGetters);
  }

  return groupsGetters;
};

const getScales = ({
  xMinValue,
  xMaxValue,
  yMinValue,
  yMaxValue,
  width,
  height,
}: {
  xMinValue: ExtremeValue;
  xMaxValue: ExtremeValue;
  yMinValue: ExtremeValue;
  yMaxValue: ExtremeValue;
  width: number;
  height: number;
}): {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
} => {
  const xScale = scaleLinear()
    .domain([xMinValue.actual, xMaxValue.actual])
    .range([0, width]);
  const yScale = scaleLinear()
    .domain([yMinValue.actual, yMaxValue.actual])
    .range([height, 0]);

  return {
    xScale,
    yScale,
  };
};
