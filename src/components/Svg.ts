import { select, Selection } from "d3-selection";
import { TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";

export type MeasureTextOptions = {
  paddingLeft?: number;
  paddingRight?: number;
};

export type Svg = {
  selection: SVGSelection;
  measure: () => DOMRect;
  measureText: (
    text: string | number,
    textType: TextType,
    options?: MeasureTextOptions
  ) => DOMRect;
};

export type SVGSelection = Selection<
  SVGSVGElement,
  unknown,
  HTMLDivElement,
  undefined
>;

export const makeSvg = (div: HTMLDivElement, background: string): Svg => {
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
    options?: MeasureTextOptions
  ): DOMRect => {
    const { width } = measure();
    const { paddingLeft = 0, paddingRight } = options ?? {};
    const root = select(document.body)
      .append("div")
      .style("box-sizing", "border-box")
      .style("max-width", `${width}px`)
      .style("padding-left", `${paddingLeft}px`)
      .style("padding-right", `${paddingRight}px`);
    const node = root
      .append("div")
      .style("width", "fit-content")
      .style("height", "fit-content")
      .style("line-height", 1.5)
      .style("font-size", `${FONT_SIZE[textType]}px`)
      .style("font-weight", FONT_WEIGHT[textType])
      .text(text)
      .node() as HTMLDivElement;
    const rect = node.getBoundingClientRect();
    root.remove();

    return rect;
  };

  return {
    selection,
    measure,
    measureText,
  };
};
