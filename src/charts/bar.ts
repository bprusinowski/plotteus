import { ScaleBand, scaleBand, ScaleLinear, scaleLinear } from "d3-scale";
import { Datum, Group } from "../components";
import { BAR, getPathData } from "../coords";
import { BaseMax, ChartSubtype } from "../types";
import { FONT_SIZE, getTextColor } from "../utils";
import {
  getGroupLabelStrokeWidth,
  getRotate,
  STROKE_WIDTH,
  TEXT_MARGIN,
} from "./utils";

const PADDING_X0 = 0.1;
const PADDING_X1 = 0.05;

type GetBarGetterProps = {
  type: ChartSubtype | undefined;
} & Group.ValueGetterProps;

export const getBarGetters = (props: GetBarGetterProps): Group.Getter[] => {
  const {
    type = "grouped",
    groups,
    maxValue,
    groupsKeys,
    dataKeys,
    shareDomain,
    showValues,
    showDatumLabels,
    svg,
    dims: { width, height, margin, BASE_MARGIN },
    textDims,
    colorMap,
    cartoonize,
  } = props;
  const isGrouped = type === "grouped";
  const { x0Scale, x0bw, x1Scale, x1bw, yScale } = getScales({
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
      const labelHeight = textDims.datumLabel.height;
      const labelYShift = textDims.datumLabel.yShift;
      const valueHeight = textDims.datumValue.height;
      const valueYShift = textDims.datumValue.yShift;

      const datumGetters: Datum.Getter = {
        key,
        type: "value",
        teleportKey: `${group.key}:${key}`,
        teleportFrom: datum.teleportFrom,
        value,
        g: ({ s, _g }) => {
          const d = s(BAR, getD());
          const clipPath =
            isGrouped && showValues ? s(BAR, getD(valueHeight * 2)) : d;
          const x = s(0, datumX + (x1bw - x0bw) * 0.5);
          const y = s(0, (datumY - height) * 0.5 - currentAccHeight);
          const rotate = getRotate(_g?.rotate);
          const strokeWidth = s(0, value ? STROKE_WIDTH : 0);
          const labelX = isGrouped
            ? 0
            : s(
                0,
                (svg.measureText(key, "datumLabel").width - x1bw) * 0.5 +
                  TEXT_MARGIN
              );
          const labelY = isGrouped
            ? s(0, dHeight * 0.5 - labelHeight - TEXT_MARGIN)
            : s(0, -(dHeight * 0.5 + labelYShift));
          const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
          const labelFill = getTextColor(datumFill);
          const valueX = isGrouped
            ? 0
            : s(
                0,
                (svg.measureText(value, "datumValue").width - x1bw) * 0.5 +
                  TEXT_MARGIN
              );
          const valueY = isGrouped
            ? s(0, -(dHeight * 0.5 + valueHeight))
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
};

const getScales = ({
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
