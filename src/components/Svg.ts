import { select, Selection } from "d3-selection";
import { TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";

export type Svg = {
  selection: SVGSelection;
  measure: () => DOMRect;
  measureText: (
    text: string | number,
    textType: TextType,
    options?: { paddingX?: number }
  ) => DOMRect;
};

export type SVGSelection = Selection<
  SVGSVGElement,
  unknown,
  HTMLDivElement,
  undefined
>;

export const makeSvg = (
  div: HTMLDivElement,
  background: string = "#FFFFFF"
): Svg => {
  const selection = select(div)
    .selectAll("svg")
    .data([null])
    .join("svg")
    .style("width", "100%")
    .style("height", "100%")
    .style("transform", "translate3d(0, 0, 0)")
    .style("border-left", "3px solid transparent")
    .style("background", background)
    .style("transition", "border-left 0.3s ease") as SVGSelection;

  const measure = (): DOMRect => {
    return (selection.node() as SVGSVGElement).getBoundingClientRect();
  };
  const measureText = (
    text: string | number,
    textType: TextType,
    options?: { paddingX?: number }
  ): DOMRect => {
    const { paddingX = 0 } = options ?? {};
    const root = select(div)
      .append("div")
      .style("padding-left", `${paddingX}px`)
      .style("padding-right", `${paddingX}px`);
    const node = root
      .append("div")
      .style("width", "fit-content")
      .style("height", "fit-content")
      .style("line-height", 1.5)
      .style("font-size", `${FONT_SIZE[textType]}px`)
      .style("font-weight", FONT_WEIGHT[textType])
      .html(text.toString())
      .node() as HTMLDivElement;
    const rect = node.getBoundingClientRect();
    node.remove();
    root.remove();

    return rect;
  };

  return {
    selection,
    measure,
    measureText,
  };
};
