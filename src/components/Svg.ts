import { select, Selection } from "d3-selection";
import { StoryOptions, TextType } from "../types";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";

export type MeasureTextOptions = {
  maxWidth?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
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

export const createSvg = (div: HTMLDivElement, options: StoryOptions): Svg => {
  const { svgBackgroundColor } = options;
  const selection = select(div)
    .selectAll("svg")
    .data([null])
    .join("svg")
    .style("width", "100%")
    .style("height", "100%")
    .style("transform", "translate3d(0, 0, 0)")
    .style("border-left", "3px solid transparent")
    .style("background", svgBackgroundColor)
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
    const {
      paddingLeft = 0,
      paddingTop = 0,
      paddingRight = 0,
      paddingBottom = 0,
    } = options ?? {};
    const maxWidth = options?.maxWidth
      ? Math.min(width, options.maxWidth)
      : width;
    const root = select(div)
      .append("div")
      .attr("aria-hidden", "true")
      .style("z-index", -1)
      .style("position", "absolute")
      .style("top", 0)
      .style("left", 0)
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("box-sizing", "border-box")
      .style("max-width", `${maxWidth}px`);
    const node = root
      .append("div")
      .style("width", "fit-content")
      .style("height", "fit-content")
      .style("padding-left", `${paddingLeft}px`)
      .style("padding-top", `${paddingTop}px`)
      .style("padding-right", `${paddingRight}px`)
      .style("padding-bottom", `${paddingBottom}px`)
      .style("line-height", 1.5)
      .style("font-size", `${FONT_SIZE[textType]}px`)
      .style("font-weight", FONT_WEIGHT[textType])
      .text(text)
      .node() as HTMLDivElement;
    const rect = node.getBoundingClientRect();
    root.remove();

    return {
      ...rect,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    };
  };

  return {
    selection,
    measure,
    measureText,
  };
};
