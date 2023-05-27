import { ScaleBand, scaleBand, ScaleLinear, scaleLinear } from "d3-scale";
import { AxisTick, Datum, Group } from "../components";
import { BAR, getPathData } from "../coords";
import { BarChartLayout, BarChartSubtype, BaseMax } from "../types";
import { FONT_SIZE, getTextColor } from "../utils";
import {
  getGroupLabelStrokeWidth,
  getRotate,
  STROKE_WIDTH,
  TEXT_MARGIN,
} from "./utils";

type GetBarGetterProps = {
  type: BarChartSubtype | undefined;
  layout: BarChartLayout | undefined;
} & Group.ValueGetterProps;

export const getBarGetters = (props: GetBarGetterProps): Group.Getter[] => {
  const {
    type = "grouped",
    layout = "vertical",
    groups,
    maxValue,
    groupsKeys,
    dataKeys,
    shareDomain,
    showValues,
    showDatumLabels,
    svg,
    dims: { width, fullWidth, height, fullHeight, margin, BASE_MARGIN },
    textDims,
    colorMap,
    cartoonize,
  } = props;
  const isGrouped = type === "grouped";
  const isVertical = layout === "vertical";
  const labelHeight = textDims.datumLabel.height;
  const labelYShift = textDims.datumLabel.yShift;
  const valueHeight = textDims.datumValue.height;
  const valueYShift = textDims.datumValue.yShift;

  if (isVertical) {
    const { x0Scale, x0bw, x1Scale, x1bw, yScale } = getVerticalScales({
      isGrouped,
      groupsKeys,
      dataKeys,
      maxValue,
      width,
      height,
    });
    const groupsGetters: Group.Getter[] = [];

    for (const group of groups) {
      const { key } = group;
      const groupX0 = x0Scale(key) as number;
      const groupGetters: Group.Getter = {
        key,
        g: ({ s, _g }) => {
          const d = BAR;
          const x = margin.left + groupX0 + x0bw * 0.5;
          const y = margin.top + height;
          const labelX = 0;
          const labelY = BASE_MARGIN;
          const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
          const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
          const opacity = group.opacity ?? 1;

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

      let accHeight = 0;

      for (const datum of group.data) {
        const { key, value, fill } = datum;

        if (!shareDomain) {
          x1Scale.domain(group.data.map((d) => d.key));
        }

        const datumX = x1Scale(key) as number;
        const datumY = yScale(value);
        const dHeight = height - datumY;

        const currentAccHeight = accHeight;

        if (!isGrouped) {
          accHeight += dHeight;
        }

        const datumFill = fill ?? colorMap.get(key, group.key, shareDomain);
        const getD = (padding = 0): string => {
          return getPathData({
            type: "bar",
            width: x1bw,
            height: dHeight + padding,
            cartoonize,
          });
        };

        const datumGetters: Datum.Getter = {
          key,
          type: "value",
          teleportKey: `${group.key}:${key}`,
          teleportFrom: datum.teleportFrom,
          value,
          g: ({ s, _g }) => {
            const d = s(BAR, getD());
            const clipPath =
              // Do not clip grouped bar labels.
              isGrouped && showValues ? s(BAR, getD(fullHeight * 2)) : d;
            const x = s(0, datumX + (x1bw - x0bw) * 0.5);
            const y = s(0, (datumY - height) * 0.5 - currentAccHeight);
            const rotate = getRotate(_g?.rotate);
            const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
            const labelWidth = svg.measureText(key, "datumLabel").width;
            const labelX = isGrouped
              ? 0
              : s(0, (labelWidth - x1bw) * 0.5 + TEXT_MARGIN);
            const labelY = isGrouped
              ? s(0, dHeight * 0.5 - labelHeight - TEXT_MARGIN)
              : s(0, -(dHeight * 0.5 + labelYShift));
            const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
            const labelFill = getTextColor(datumFill);
            const valueWidth = svg.measureText(value, "datumValue").width;
            const valueX = isGrouped
              ? 0
              : s(0, (valueWidth - x1bw) * 0.5 + TEXT_MARGIN);
            const baseGroupedValueY = -(dHeight * 0.5 + valueHeight);
            const valueY = isGrouped
              ? s(
                  0,
                  showDatumLabels
                    ? baseGroupedValueY + valueHeight < labelY
                      ? baseGroupedValueY
                      : labelY - textDims.datumLabel.height
                    : baseGroupedValueY
                )
              : s(
                  0,
                  showDatumLabels
                    ? labelY + labelHeight
                    : -(dHeight * 0.5 + valueYShift)
                );
            const valueFontSize = showValues ? s(0, FONT_SIZE.datumValue) : 0;
            const valueFill = isGrouped ? "black" : labelFill;
            const opacity = datum.opacity ?? 1;

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
  } else {
    const { xScale, y0Scale, y0bw, y1Scale, y1bw } = getHorizontalScales({
      isGrouped,
      groupsKeys,
      dataKeys,
      maxValue,
      width,
      height,
      labelMargin: textDims.groupLabel.height + BASE_MARGIN * 0.5,
    });
    const groupsGetters: Group.Getter[] = [];

    for (const group of groups) {
      const { key } = group;
      const groupY0 = y0Scale(key) as number;
      const groupGetters: Group.Getter = {
        key,
        g: ({ s, _g }) => {
          const d = BAR;
          const x = margin.left;
          const y = margin.top + groupY0 + y0bw * 0.5;
          const labelWidth = svg.measureText(key, "groupLabel").width;
          const labelX = labelWidth * 0.5;
          const labelY =
            -(y1bw * (isGrouped ? dataKeys.length : 1)) * 0.5 -
            textDims.groupLabel.height * 0.5;
          const labelFontSize = s(0, shareDomain ? FONT_SIZE.groupLabel : 0);
          const labelStrokeWidth = getGroupLabelStrokeWidth(labelFontSize);
          const opacity = group.opacity ?? 1;

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

      let accWidth = 0;

      for (const datum of group.data) {
        const { key, value, fill } = datum;

        if (!shareDomain) {
          y1Scale.domain(group.data.map((d) => d.key));
        }

        const datumX = 0;
        const datumY =
          (y1Scale(key) as number) + textDims.groupLabel.height * 0.5;
        const dWidth = xScale(value);

        const currentAccWidth = accWidth;

        if (!isGrouped) {
          accWidth += dWidth;
        }

        const datumFill = fill ?? colorMap.get(key, group.key, shareDomain);
        const getD = (padding = 0): string => {
          return getPathData({
            type: "bar",
            width: dWidth + padding,
            // Manually reduce the height so group labels can fit.
            // That's why PADDING_Y1 equals to 0.
            height: y1bw - BASE_MARGIN * 0.25,
            cartoonize,
          });
        };

        const datumGetters: Datum.Getter = {
          key,
          type: "value",
          teleportKey: `${group.key}:${key}`,
          teleportFrom: datum.teleportFrom,
          value,
          g: ({ s, _g }) => {
            const d = s(BAR, getD());
            // Do not clip grouped bar labels.
            const clipPath = isGrouped ? s(BAR, getD(fullWidth * 2)) : d;
            const x = s(0, datumX + dWidth * 0.5 + currentAccWidth);
            const y = s(0, datumY + (y1bw - y0bw) * 0.5);
            const rotate = getRotate(_g?.rotate);
            const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
            const labelWidth = svg.measureText(key, "datumLabel").width;
            const labelX = s(
              labelWidth * 0.5 + BASE_MARGIN * 0.5,
              -dWidth * 0.5 + labelWidth * 0.5 + BASE_MARGIN * 0.5
            );
            const labelY = s(0, labelYShift);
            const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
            const labelFill = getTextColor(datumFill);
            const valueWidth = svg.measureText(value, "datumValue").width;
            const valueX = isGrouped
              ? labelX + labelWidth > (dWidth + valueWidth + BASE_MARGIN) * 0.5
                ? labelX + (labelWidth + valueWidth + BASE_MARGIN) * 0.5
                : (dWidth + valueWidth + BASE_MARGIN) * 0.5
              : showDatumLabels
              ? labelX + labelWidth + valueWidth * 0.5 + BASE_MARGIN * 0.25
              : 0;
            const valueY = s(valueHeight * 0.5, valueYShift);
            const valueFontSize = showValues ? s(0, FONT_SIZE.datumValue) : 0;
            const valueFill = isGrouped ? "black" : labelFill;
            const opacity = datum.opacity ?? 1;

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
  }
};

const getVerticalScales = ({
  isGrouped,
  groupsKeys,
  dataKeys,
  maxValue,
  width,
  height,
}: {
  isGrouped: boolean;
  groupsKeys: string[];
  dataKeys: string[];
  maxValue: BaseMax;
  width: number;
  height: number;
}): {
  x0Scale: ScaleBand<string>;
  x0bw: number;
  x1Scale: ScaleBand<string>;
  x1bw: number;
  yScale: ScaleLinear<number, number>;
} => {
  const PADDING_X0 = 0.1;
  const PADDING_X1 = 0.05;

  const singleGroup = groupsKeys.length === 1;
  const x0Scale = scaleBand()
    .domain(groupsKeys)
    .range([0, width])
    .paddingInner(singleGroup ? 0 : PADDING_X0);
  const x0bw = x0Scale.bandwidth();
  const yScale = scaleLinear()
    .domain([0, maxValue.actual])
    .range([height, maxValue.actual === 0 ? height : 0]);

  const x1Scale = scaleBand().domain(dataKeys).paddingInner(PADDING_X1);
  let x1bw: number;

  if (isGrouped) {
    x1Scale.range([0, x0bw]);
    x1bw = x1Scale.bandwidth();
  } else {
    x1Scale.range([0, 0]);
    x1bw = x0bw;
  }

  return {
    x0Scale,
    x0bw,
    x1Scale,
    x1bw,
    yScale,
  };
};

const getHorizontalScales = ({
  isGrouped,
  groupsKeys,
  dataKeys,
  maxValue,
  width,
  height,
  labelMargin,
}: {
  isGrouped: boolean;
  groupsKeys: string[];
  dataKeys: string[];
  maxValue: BaseMax;
  width: number;
  height: number;
  labelMargin: number;
}): {
  xScale: ScaleLinear<number, number>;
  y0Scale: ScaleBand<string>;
  y0bw: number;
  y1Scale: ScaleBand<string>;
  y1bw: number;
} => {
  const PADDING_Y0 = 0.1;
  // We reduce the height manually in datum getters, so we don't need to add padding,
  // especially that it's relative and we need absolute trim.
  const PADDING_Y1 = 0;

  const singleGroup = groupsKeys.length === 1;
  const y0Scale = scaleBand()
    .domain(groupsKeys)
    .range([height + labelMargin - AxisTick.SIZE * 2, 0])
    .paddingInner(singleGroup ? 0 : PADDING_Y0);
  const y0bw = y0Scale.bandwidth() - labelMargin;
  const xScale = scaleLinear()
    .domain([0, maxValue.actual])
    .range([0, maxValue.actual === 0 ? 0 : width]);

  const y1Scale = scaleBand().domain(dataKeys).paddingInner(PADDING_Y1);
  let y1bw: number;

  if (isGrouped) {
    y1Scale.range([0, y0bw]);
    y1bw = y1Scale.bandwidth();
  } else {
    y1Scale.range([0, 0]);
    y1bw = y0bw;
  }

  return {
    xScale,
    y0Scale,
    y0bw,
    y1Scale,
    y1bw,
  };
};
