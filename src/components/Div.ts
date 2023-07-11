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
): {
  destroy: () => void;
} => {
  const selection = select(div)
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
    .text("Font load trigger");

  const observer = new ResizeObserver(callback);
  observer.observe(selection.node() as HTMLDivElement);

  return {
    destroy: () => {
      observer.disconnect();
      selection.remove();
    },
  };
};

export const createResizeObserver = (
  div: HTMLDivElement,
  callback: () => void
): {
  destroy: () => void;
} => {
  const observer = new ResizeObserver(callback);
  observer.observe(div);

  return {
    destroy: () => {
      observer.disconnect();
    },
  };
};
