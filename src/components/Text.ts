import { Selection } from "d3-selection";
import { Dimensions, ResolvedDimensions } from "../dims";
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
  svg,
  svgBackgroundColor,
  dims: { fullWidth, margin, BASE_MARGIN },
}: {
  text: string;
  type: TextType;
  anchor: Anchor;
  svg: Svg;
  svgBackgroundColor: string;
  dims: ResolvedDimensions;
}): Getter => {
  const dims = svg.measureText(text, type, {
    paddingLeft: margin.left,
    paddingRight: margin.right,
  });

  return {
    key: text,
    g: ({ s, _g }) => {
      let x: number;
      switch (anchor) {
        case "start":
          x = margin.left;
          break;
        case "middle":
          x = (fullWidth - dims.width) * 0.5;
          break;
        case "end":
          x = fullWidth - dims.width - margin.right;
          break;
      }

      return {
        x: s(x, null, _g?.x),
        y: s(margin.top, null, _g?.y),
        width: s(dims.width, null, _g?.width),
        height: s(dims.height, null, _g?.height),
        fontSize: FONT_SIZE[type],
        fontWeight: FONT_WEIGHT[type],
        color: s(
          `rgba(${hexToRgb(svgBackgroundColor)}, 0)`,
          getTextColor(svgBackgroundColor)
        ),
      };
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
  const className = `text ${key}`;

  selection
    .selectAll<SVGForeignObjectElement, Resolved>(`.text.${key}`)
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
    .style("dominant-baseline", "hanging")
    .style("color", (d) => d.color)
    .text((d) => d.key);
};

export const updateDims = ({
  dims,
  svg,
  textType,
  text,
}: {
  dims: Dimensions;
  svg: Svg;
  textType: TextType;
  text: string;
}): void => {
  const { height } = svg.measureText(text, textType);
  dims.addTop(height);
};
