import { scaleLinear } from "d3-scale";
import { Selection } from "d3-selection";
import { HALF_FONT_K } from "../charts/utils";
import { ResolvedDimensions } from "../dims";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";
import * as Generic from "./Generic";
import style from "./Tick.module.scss";
import * as VerticalAxis from "./VerticalAxis";

export const WIDTH = 12;

type G = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  opacity: number;
};

export type Getter = Generic.Getter<G>;

export const getters = ({
  ticks,
  maxValue,
  _maxValue,
  dims: { width, height },
  tickHeight,
}: {
  ticks: number[];
  maxValue: number;
  _maxValue: number | undefined;
  dims: ResolvedDimensions;
  tickHeight: number;
}): Getter[] => {
  const yScale = scaleLinear().domain([maxValue, 0]).range([0, height]);
  let _yScale: (tick: number) => number = () => height;

  if (_maxValue !== undefined) {
    _yScale = scaleLinear().domain([_maxValue, 0]).range([0, height]);
  }

  return ticks.map((tick) => {
    const getters: Getter = {
      key: `${tick}`,
      g: ({ s }) => {
        const x = -WIDTH;
        const y = s(
          _yScale(tick),
          (1 - tick / maxValue) * height,
          yScale(tick)
        );

        return {
          x,
          y,
          width,
          height: tickHeight,
          fontSize: FONT_SIZE.tick,
          opacity: s(0, 1),
        };
      },
    };

    return getters;
  });
};

export type Int = Generic.Int<G>;

export const ints = Generic.ints;

export type Resolved = Generic.Resolved<G>;

export const resolve = Generic.resolve;

export const render = ({
  verticalAxisSelection,
  resolved,
}: {
  verticalAxisSelection: Selection<
    SVGGElement,
    VerticalAxis.Resolved,
    SVGSVGElement,
    unknown
  >;
  resolved: Resolved[];
}): void => {
  verticalAxisSelection
    .selectAll<SVGGElement, Resolved>(`.${style.node}`)
    .data(resolved, (d) => d.key)
    .join("g")
    .attr("class", style.node)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", (d) => d.opacity)
    .call((g) =>
      g
        .selectAll(`.${style.label}`)
        .data((d) => [d])
        .join("text")
        .attr("class", style.label)
        .attr("dy", (d) => -d.height * HALF_FONT_K)
        .style("font-size", (d) => d.fontSize)
        .style("font-weight", FONT_WEIGHT.tick)
        .text((d) => d.key)
    )
    .call((g) =>
      g
        .selectAll(`.${style.boldLine}`)
        .data((d) => [d])
        .join("line")
        .attr("class", style.boldLine)
        .attr("x1", 2)
        .attr("x2", 7)
    )
    .call((g) =>
      g
        .selectAll(`.${style.lightLine}`)
        .data((d) => [d])
        .join("line")
        .attr("class", style.lightLine)
        .attr("x1", 7)
        .attr("x2", (d) => d.width)
    );
};
