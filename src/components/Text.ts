import { Selection } from "d3-selection";
import { ResolvedDimensions } from "../dims";
import { Anchor, TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";
import * as Generic from "./Generic";
import { Svg } from "./Svg";

type G = {
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  opacity: number;
};

export type Getter = Generic.Getter<G>;

export const getter = ({
  text,
  textType,
  anchor,
  svg,
  dims: { fullWidth, margin },
}: {
  text: string;
  textType: TextType;
  anchor: Anchor;
  svg: Svg;
  dims: ResolvedDimensions;
}): Getter => {
  const { width: textWidth } = svg.measureText(text, textType);

  return {
    key: text,
    g: ({ s, _g }) => {
      let x: number;
      switch (anchor) {
        case "start":
          x = margin.left;
          break;
        case "middle":
          x = (fullWidth - textWidth) * 0.5;
          break;
        case "end":
          x = fullWidth - textWidth - margin.right;
          break;
      }

      return {
        x: s(x, null, _g?.x),
        y: s(margin.top, null, _g?.y),
        fontSize: FONT_SIZE[textType],
        fontWeight: FONT_WEIGHT[textType],
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
  selection,
  resolved,
  key,
}: {
  selection: Selection<any, any, Element, unknown>;
  resolved: Resolved[];
  key: string;
}): void => {
  const className = `text ${key}`;

  selection
    .selectAll<SVGTextElement, Resolved>(`.text.${key}`)
    .data(resolved, (d) => d.key)
    .join("text")
    .attr("class", className)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("font-size", (d) => d.fontSize)
    .style("font-weight", (d) => d.fontWeight)
    .style("dominant-baseline", "hanging")
    .style("opacity", (d) => d.opacity)
    .text((d) => d.key);
};
