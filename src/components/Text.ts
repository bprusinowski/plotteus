import { Selection } from "d3-selection";
import { Dimensions } from "../dims";
import { Anchor, TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT, getTextColor, hexToRgb } from "../utils";
import * as Generic from "./Generic";
import { Svg } from "./Svg";

type G = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: number;
  color: string;
};

export type Getter = Generic.Getter<G>;

export const getter = ({
  text,
  type,
  anchor,
  svgBackgroundColor,
  dims: { fullWidth, margin },
  textDims,
}: {
  text: string;
  type: TextType;
  anchor: Anchor;
  svg: Svg;
  svgBackgroundColor: string;
  dims: Dimensions;
  textDims: DOMRect;
}): Getter => {
  return {
    key: text,
    g: ({ s, _g }) => {
      let x: number;
      switch (anchor) {
        case "start":
          x = margin.left;
          break;
        case "middle":
          x = (fullWidth - textDims.width) * 0.5;
          break;
        case "end":
          x = fullWidth - textDims.width - margin.right;
          break;
      }

      const color =
        getTextColor(svgBackgroundColor) === "black" ? "#000000" : "#FFFFFF";

      const g: G = {
        x: s(x, null, _g?.x),
        y: s(margin.top, null, _g?.y),
        width: s(textDims.width, null, _g?.width),
        height: s(textDims.height, null, _g?.height),
        fontSize: FONT_SIZE[type],
        fontWeight: FONT_WEIGHT[type],
        color: s(`rgba(${hexToRgb(color)}, 0)`, color),
      };

      return g;
    },
  };
};

export type Int = Generic.Int<G>;

export const ints = Generic.ints<G, Getter, Int>();

export type Resolved = Generic.Resolved<G>;

export const resolve = Generic.resolve<G, Resolved, Int>();

export const render = ({
  selection,
  resolved,
  key,
}: {
  selection: Selection<any, any, Element, unknown>;
  resolved: Resolved[];
  key: string;
}): void => {
  const className = `plotteus-text plotteus-${key}`;

  selection
    .selectAll<SVGForeignObjectElement, Resolved>(
      `.plotteus-text.plotteus-${key}`
    )
    .data(resolved, (d) => d.key)
    .join("foreignObject")
    .attr("class", className)
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("width", (d) => d.width)
    .attr("height", (d) => d.height)
    .selectAll("div")
    .data((d) => [d])
    .join("xhtml:div")
    // TODO: consolidate this per TextType
    .style("line-height", 1.5)
    .style("font-size", (d) => `${d.fontSize}px`)
    .style("font-weight", (d) => d.fontWeight)
    .style("color", (d) => d.color)
    .text((d) => d.key);
};

export const updateDims = ({
  dims,
  textDims,
}: {
  dims: Dimensions;
  textDims: DOMRect;
}): void => {
  const { height } = textDims;
  dims.addTop(height);
};
