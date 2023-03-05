import { scaleLinear } from "d3-scale";
import { ResolvedDimensions } from "../dims";
import { max } from "../utils";
import * as Generic from "./Generic";
import { Svg } from "./Svg";
import * as Tick from "./Tick";

type G = {
  x: number;
  y: number;
  opacity: number;
};

export type Getter = Generic.Getter<G>;

export const getters = ({ dims }: { dims: ResolvedDimensions }): Getter => {
  return {
    key: "verticalAxis",
    g: ({ s, _g }) => {
      return {
        x: s(dims.margin.left, null, _g?.x),
        y: s(dims.margin.top, null, _g?.y),
        opacity: s(0, 1),
      };
    },
  };
};

export type Int = Generic.Int<G>;

export const ints = Generic.ints;

export type Resolved = Generic.Resolved<G>;

export const resolve = Generic.resolve;

export const render = ({
  resolved,
  svg,
}: {
  resolved: Resolved[];
  svg: Svg;
}) => {
  return (
    svg.selection
      .selectAll<SVGGElement, Resolved>(".vertical-axis")
      .data(resolved)
      .join("g")
      .attr("class", "vertical-axis")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .style("opacity", (d) => d.opacity)
      // Vertical axis needs to be the first element in SVG, so it doesn't overlap bars.
      .lower()
  );
};

export const getWidth = ({
  svg,
  maxValue,
}: {
  svg: Svg;
  maxValue: number;
}): number => {
  const ticks = scaleLinear().domain([0, maxValue]).nice().ticks(5);
  const ticksWidths = ticks.map((d) => {
    return svg.measureText(d, "tick").width;
  });

  return (max(ticksWidths) as number) + Tick.WIDTH;
};
