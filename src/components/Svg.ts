import { select, Selection } from "d3-selection";
import { TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";

export type Svg = {
  selection: SVGSelection;
  measure: () => DOMRect;
  measureText: (text: string | number, textType: TextType) => DOMRect;
};

type SVGSelection = Selection<
  SVGSVGElement,
  unknown,
  HTMLDivElement,
  undefined
>;

export const makeSvg = (div: HTMLDivElement): Svg => {
  const selection = select(div)
    .selectAll("svg")
    .data([null])
    .join("svg")
    .style("width", "100%")
    .style("height", "100%")
    .style("transform", "translate3d(0, 0, 0)")
    .style("border-left", "3px solid transparent")
    .style("transition", "border-left 0.3s ease") as SVGSelection;

  const measure = (): DOMRect => {
    return (selection.node() as SVGSVGElement).getBoundingClientRect();
  };

  const measureText = (text: string | number, textType: TextType): DOMRect => {
    const node = selection
      .append("text")
      .style("font-size", FONT_SIZE[textType])
      .style("font-weight", FONT_WEIGHT[textType])
      .text(text)
      .node() as SVGTextElement;

    const rect = node.getBoundingClientRect();
    node.remove();

    return rect;
  };

  return {
    selection,
    measure,
    measureText,
  };
};
