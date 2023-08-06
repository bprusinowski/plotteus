import { ScaleBand, ScaleLinear, scaleBand, scaleLinear } from "d3-scale";
import { Datum } from ".";
import * as Story from "..";
import { BUBBLE, getPathData } from "../coords";
import { Dimensions } from "../dims";
import {
  BeeswarmInputStep,
  ChartType,
  InputAxis,
  InputGroupPosition,
  Layout,
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
  getForceAlignedPositions,
  getGroupLabelStrokeWidth,
  getRotate,
} from "./utils";

export type Info = Story.Info &
  Chart.BaseInfo & {
    type: "beeswarm";
    layout: Layout;
    groups: InputGroupPosition[];
    minValue: number;
    maxValue: number;
    verticalAxis: InputAxis | undefined;
    horizontalAxis: InputAxis | undefined;
  };

export const info = (
  storyInfo: Story.Info,
  svgBackgroundColor: string,
  inputStep: BeeswarmInputStep
): Info => {
  const {
    layout = "horizontal",
    groups,
    shareDomain = false,
    positionScale,
  } = inputStep;
  const type: ChartType = "beeswarm";
  const positions = inputStep.groups.flatMap((g) => {
    return g.data.map((d) => d.position);
  });
  const [minValue, maxValue] = [
    positionScale?.minValue ?? min(positions) ?? 0,
    positionScale?.maxValue ?? max(positions) ?? 0,
  ];

  return {
    ...storyInfo,
    ...Chart.baseInfo(svgBackgroundColor, inputStep, shareDomain),
    type,
    layout,
    groups,
    minValue,
    maxValue,
    verticalAxis:
      inputStep.layout === "vertical" ? inputStep.verticalAxis : undefined,
    horizontalAxis:
      inputStep.layout === "horizontal" || inputStep.layout === undefined
        ? inputStep.horizontalAxis
        : undefined,
  };
};

export const xExtent = (inputStep: BeeswarmInputStep): Chart.Extent => {
  const { layout, positionScale } = inputStep;

  if (layout === "vertical") {
    return;
  }

  const positions = inputStep.groups.flatMap((g) => {
    return g.data.map((d) => d.position);
  });

  return [
    positionScale?.minValue ?? min(positions) ?? 0,
    positionScale?.maxValue ?? max(positions) ?? 0,
  ];
};

export const yExtent = (inputStep: BeeswarmInputStep): Chart.Extent => {
  const { layout, positionScale } = inputStep;

  if (layout === "horizontal") {
    return;
  }

  const positions = inputStep.groups.flatMap((g) => {
    return g.data.map((d) => d.position);
  });

  return [
    positionScale?.minValue ?? min(positions) ?? 0,
    positionScale?.maxValue ?? max(positions) ?? 0,
  ];
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
    layout,
    groups,
    groupsKeys,
    minValue,
    maxValue,
    shareDomain,
    showValues,
    svgBackgroundColor,
  } = info;
  const {
    showDatumLabels,
    dims: { width, height, margin },
    textTypeDims,
    colorMap,
    cartoonize,
  } = props;
  const showDatumLabelsAndValues = showDatumLabels && showValues;
  const groupFill = deriveSubtlerColor(svgBackgroundColor);
  const groupLabelFill = getTextColor(svgBackgroundColor);
  const groupLabelStroke = svgBackgroundColor;
  const datumStroke = svgBackgroundColor;

  const groupsGetters: Chart.Getter[] = [];

  if (layout === "horizontal") {
    const { xScale, yScale, ybw } = getHorizontalScales({
      groupsKeys,
      minValue,
      maxValue,
      width,
      height,
    });

    for (const group of groups) {
      const { key } = group;
      const positions = group.data.map((d) => d.position);
      const [minGroupX, maxGroupX] = [
        xScale(min(positions) ?? 0),
        xScale(max(positions) ?? 0),
      ];
      const groupXShift = (maxGroupX + minGroupX) * 0.5;
      const groupX = margin.left + groupXShift;
      const groupY = margin.top + (yScale(key) as number) + ybw * 0.5;
      const groupGetters: Chart.Getter = {
        key,
        g: ({ s, _g }) => {
          const d = BUBBLE;
          const labelX = groupX;
          const labelY = groupY + textTypeDims.groupLabel.yShift;
          const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
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

      const dataPositions = getForceAlignedPositions(
        group.data,
        layout,
        groupX,
        groupY,
        xScale,
        () => 0
      );

      for (const datum of group.data) {
        const { key, position, fill } = datum;
        const datumFill = fill ?? colorMap.get(key, group.key, shareDomain);
        const datumPosition = dataPositions[datum.key];
        const datumGetters: Datum.Getter = {
          key,
          type: "position",
          teleportKey: `${group.key}:${key}`,
          teleportFrom: datum.teleportFrom,
          positionValue: position,
          g: ({ s, _g }) => {
            const d = s(
              BUBBLE,
              getPathData({
                type: "bubble",
                r: 4,
                cartoonize,
              })
            );
            const clipPath = d;
            const x = s(groupX, datumPosition.x - groupXShift, _g?.x);
            const y = s(margin.top + height * 0.5, datumPosition.y, _g?.y);
            const rotate = getRotate(_g?.rotate, cartoonize);
            const strokeWidth = STROKE_WIDTH;
            const labelX = 0;
            const labelY =
              textTypeDims.datumLabel.yShift -
              (showDatumLabelsAndValues
                ? textTypeDims.datumLabel.height * 0.5
                : 0);
            const labelFontSize = 0;
            const labelFill = getTextColor(datumFill);
            const labelStroke = datumFill;
            const valueX = 0;
            const valueY = 0;
            const valueFontSize = 0;
            const valueFill = labelFill;
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
  } else {
    const { xScale, xBw, yScale } = getVerticalScales({
      groupsKeys,
      minValue,
      maxValue,
      width,
      height,
    });

    for (const group of groups) {
      const { key } = group;
      const positions = group.data.map((d) => d.position);
      const [minGroupY, maxGroupY] = [
        yScale(min(positions) ?? 0),
        yScale(max(positions) ?? 0),
      ];
      const groupYShift = (minGroupY + maxGroupY) * 0.5;
      const groupX = margin.left + (xScale(key) as number) + xBw * 0.5;
      const groupY = margin.top + groupYShift;
      const groupGetters: Chart.Getter = {
        key,
        g: ({ s, _g }) => {
          const d = BUBBLE;
          const labelX = groupX;
          const labelY = groupY + textTypeDims.groupLabel.yShift;
          const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
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

      const dataPositions = getForceAlignedPositions(
        group.data,
        layout,
        groupX,
        groupY,
        () => 0,
        yScale
      );

      for (const datum of group.data) {
        const { key, position, fill } = datum;
        const datumFill = fill ?? colorMap.get(key, group.key, shareDomain);
        const datumPosition = dataPositions[datum.key];
        const datumGetters: Datum.Getter = {
          key,
          type: "position",
          teleportKey: `${group.key}:${key}`,
          teleportFrom: datum.teleportFrom,
          positionValue: position,
          g: ({ s, _g }) => {
            const d = s(
              BUBBLE,
              getPathData({
                type: "bubble",
                r: 4,
                cartoonize,
              })
            );
            const clipPath = d;
            const x = s(groupX, datumPosition.x, _g?.x);
            const y = s(
              margin.top + height * 0.5,
              datumPosition.y - groupYShift,
              _g?.y
            );
            const rotate = getRotate(_g?.rotate, cartoonize);
            const strokeWidth = STROKE_WIDTH;
            const labelX = 0;
            const labelY =
              textTypeDims.datumLabel.yShift -
              (showDatumLabelsAndValues
                ? textTypeDims.datumLabel.height * 0.5
                : 0);
            const labelFontSize = 0;
            const labelFill = getTextColor(datumFill);
            const labelStroke = datumFill;
            const valueX = 0;
            const valueY = 0;
            const valueFontSize = 0;
            const valueFill = labelFill;
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
  }

  return groupsGetters;
};

const getVerticalScales = ({
  groupsKeys,
  minValue,
  maxValue,
  width,
  height,
}: {
  groupsKeys: string[];
  minValue: number;
  maxValue: number;
  width: number;
  height: number;
}): {
  xScale: ScaleBand<string>;
  xBw: number;
  yScale: ScaleLinear<number, number>;
} => {
  const PADDING_X = 0.1;

  const singleGroup = groupsKeys.length === 1;
  const xScale = scaleBand()
    .domain(groupsKeys)
    .range([0, width])
    .paddingInner(singleGroup ? 0 : PADDING_X);
  const xBw = xScale.bandwidth();
  const yScale = scaleLinear()
    .domain([minValue, maxValue])
    .range([maxValue === 0 ? 0 : height, 0]);

  return {
    xScale,
    xBw,
    yScale,
  };
};

const getHorizontalScales = ({
  groupsKeys,
  minValue,
  maxValue,
  width,
  height,
}: {
  groupsKeys: string[];
  minValue: number;
  maxValue: number;
  width: number;
  height: number;
}): {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
  ybw: number;
} => {
  const PADDING_Y = 0.1;

  const singleGroup = groupsKeys.length === 1;
  const yScale = scaleBand()
    .domain(groupsKeys)
    .range([0, height])
    .paddingInner(singleGroup ? 0 : PADDING_Y);
  const ybw = yScale.bandwidth();
  const xScale = scaleLinear()
    .domain([minValue, maxValue])
    .range([0, maxValue === 0 ? 0 : width]);

  return {
    xScale,
    yScale,
    ybw,
  };
};
