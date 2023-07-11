import { select } from "d3-selection";

export const prepareDiv = (div: HTMLDivElement): HTMLDivElement => {
  return select(div).style("position", "relative").node() as HTMLDivElement;
};

/** Watches font family changes.
 *
 * Super important as it impacts the text dimensions calculations (and fonts
 * are often loaded asynchronously), so we need to wait for them to load.
 */
export const createFontLoadObserver = (
  div: HTMLDivElement,
  callback: () => void
): ResizeObserver => {
  const node = select(div)
    .selectAll(".plotteus-font-load-trigger")
    .data([null])
    .join("div")
    .attr("class", "plotteus-font-load-trigger")
    .attr("aria-hidden", "true")
    .style("z-index", -1)
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0)
    .style("width", "fit-content")
    .style("height", "fit-content")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("white-space", "nowrap")
    .style("overflow", "hidden")
    .text("Font load trigger")
    .node() as HTMLDivElement;

  const observer = new ResizeObserver(callback);
  observer.observe(node);

  return observer;
};

export const createResizeObserver = (
  div: HTMLDivElement,
  callback: () => void
): ResizeObserver => {
  const observer = new ResizeObserver(callback);
  observer.observe(div);

  return observer;
};
