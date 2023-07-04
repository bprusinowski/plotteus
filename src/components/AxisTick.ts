import { scaleLinear } from "d3-scale";
import { Selection } from "d3-selection";
import { HALF_FONT_K } from "../charts/utils";
import { ResolvedDimensions } from "../dims";
import { AxisType } from "../types";
import {
  FONT_SIZE,
  FONT_WEIGHT,
  deriveSubtlerColor,
  getTextColor,
} from "../utils";
import * as Axis from "./Axis";
import * as Generic from "./Generic";

export const SIZE = 5;
export const LABEL_MARGIN = 3;

export const defaultFormat = (d: number) => d.toString();

type G = {
  x: number;
  y: number;
  size: number;
  tickLabelHeight: number;
  fontSize: number;
  color: string;
  lightLineColor: string;
  boldLineColor: string;
  opacity: number;
};

export type Getter = Generic.Getter<G>;

export const getters = ({
  axisType,
  ticks,
  minValue,
  _minValue,
  maxValue,
  _maxValue,
  dims: { width, height },
  svgBackgroundColor,
  tickHeight,
  tickFormat,
}: {
  axisType: AxisType;
  ticks: number[];
  minValue: number;
  _minValue: number | undefined;
  maxValue: number;
  _maxValue: number | undefined;
  dims: ResolvedDimensions;
  svgBackgroundColor: string;
  tickHeight: number;
  tickFormat: (d: number) => string;
}): Getter[] => {
  const isVerticalAxis = axisType === "vertical";
  const size = isVerticalAxis ? height : width;
  const scaleDomain = isVerticalAxis
    ? [maxValue, minValue]
    : [minValue, maxValue];
  const scale = scaleLinear().domain(scaleDomain).range([0, size]);
  let _scale: (tick: number) => number = () => (isVerticalAxis ? size : 0);

  if (_minValue !== undefined && _maxValue !== undefined) {
    const _scaleDomain = isVerticalAxis
      ? [_maxValue, _minValue]
      : [_minValue, _maxValue];
    _scale = scaleLinear().domain(_scaleDomain).range([0, size]);
  }

  return ticks.map((tick) => {
    const getters: Getter = {
      key: tickFormat(tick),
      g: ({ s }) => {
        const x = 0;
        const y = s(
          _scale(tick),
          (isVerticalAxis
            ? 1 - (tick - minValue) / (maxValue - minValue)
            : (tick - minValue) / (maxValue - minValue)) * size,
          scale(tick)
        );
        const color = getTextColor(svgBackgroundColor);
        const lightLineColor = deriveSubtlerColor(svgBackgroundColor);
        const boldLineColor = deriveSubtlerColor(svgBackgroundColor, 3);

        return {
          x: isVerticalAxis ? x : y,
          y: isVerticalAxis ? y : x,
          size: isVerticalAxis ? width : height,
          tickLabelHeight: tickHeight,
          fontSize: FONT_SIZE.axisTick,
          color,
          lightLineColor,
          boldLineColor,
          opacity: s(0, 1),
        };
      },
    };

    return getters;
  });
};

export type Int = Generic.Int<G>;

export const ints = Generic.ints<G, Getter, Int>();

export type Resolved = Generic.Resolved<G>;

export const resolve = Generic.resolve<G, Resolved, Int>();

export const render = ({
  selection,
  resolved,
  axisType,
}: {
  selection: Selection<SVGGElement, Axis.Resolved, SVGSVGElement, unknown>;
  resolved: Resolved[];
  axisType: AxisType;
}): void => {
  const isVerticalAxis = axisType === "vertical";

  selection
    .selectAll<SVGGElement, Resolved>(".tick")
    .data(resolved, (d) => d.key)
    .join("g")
    .attr("class", "tick")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", (d) => d.opacity)
    .call((g) =>
      g
        .selectAll(`.label`)
        .data((d) => [d])
        .join("text")
        .attr("class", "label")
        .attr(
          "transform",
          isVerticalAxis
            ? `translate(-${SIZE + LABEL_MARGIN}, 0)`
            : `translate(0, ${LABEL_MARGIN})`
        )
        .attr(
          "dy",
          (d) => (isVerticalAxis ? -1 : 1) * d.tickLabelHeight * HALF_FONT_K
        )
        .style("text-anchor", isVerticalAxis ? "end" : "middle")
        .style("font-size", (d) => `${d.fontSize}px`)
        .style("font-weight", FONT_WEIGHT.axisTick)
        .style("dominant-baseline", "hanging")
        .style("fill", (d) => d.color)
        .text((d) => d.key)
    )
    .call((g) =>
      g
        .selectAll(".bold-line")
        .data((d) => [d])
        .join("line")
        .attr("class", "bold-line")
        .attr(isVerticalAxis ? "x1" : "y1", isVerticalAxis ? -SIZE : 0)
        .attr(isVerticalAxis ? "x2" : "y2", isVerticalAxis ? 0 : SIZE)
        .style("stroke", (d) => d.boldLineColor)
    )
    .call((g) =>
      g
        .selectAll(".light-line")
        .data((d) => [d])
        .join("line")
        .attr("class", "light-line")
        .attr(isVerticalAxis ? "x1" : "y1", 0)
        .attr(isVerticalAxis ? "x2" : "y2", (d) =>
          isVerticalAxis ? d.size : -d.size
        )
        .style("stroke", (d) => d.lightLineColor)
    );
};
