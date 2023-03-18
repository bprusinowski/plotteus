import { scaleLinear, ScaleLinear } from "d3-scale";
import { Datum, Group } from "../components";
import { BAR, getPathData } from "../coords";
import { BaseMax } from "../types";
import { FONT_SIZE, getTextColor } from "../utils";
import { getGroupLabelStrokeWidth, getRotate, STROKE_WIDTH } from "./utils";

export const getScatterGetters = ({
  groups,
  maxValue: { x: xMaxValue, y: yMaxValue },
  shareDomain,
  cartoonize,
  colorMap,
  showDatumLabels,
  dims: { width, height, margin, BASE_MARGIN },
}: Group.GetterPropsXY) => {
  const { xScale, yScale } = getScales({ xMaxValue, yMaxValue, width, height });
  const groupsGetters: Group.Getter[] = [];

  for (const group of groups) {
    const { key } = group;
    const groupGetters: Group.Getter = {
      key,
      g: ({ s, _g }) => {
        const d = BAR;
        const x = margin.left + width * 0.5;
        const y = margin.top + height * 0.5;
        const labelX = 0;
        const labelY = BASE_MARGIN;
        const labelFontSize = 0;
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

    for (const datum of group.data) {
      const { key, x, y, fill } = datum;

      const datumX = xScale(x);
      const datumY = yScale(y);
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
          const x = s(0, datumX - width * 0.5);
          const y = s(0, datumY - height * 0.5);
          const rotate = getRotate(_g?.rotate);
          const strokeWidth = s(0, STROKE_WIDTH);
          const labelX = 0;
          const labelY = 0;
          const labelFontSize = showDatumLabels ? FONT_SIZE.datumLabel : 0;
          const labelFill = getTextColor(datumFill);
          const valueX = 0;
          const valueY = 0;
          const valueFontSize = 0;
          const valueFill = "black";
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
  xMaxValue,
  yMaxValue,
  width,
  height,
}: {
  xMaxValue: BaseMax;
  yMaxValue: BaseMax;
  width: number;
  height: number;
}): {
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
} => {
  const xScale = scaleLinear().domain([0, xMaxValue.actual]).range([0, width]);
  const yScale = scaleLinear().domain([0, yMaxValue.actual]).range([height, 0]);

  return {
    xScale,
    yScale,
  };
};
