import { select } from "d3-selection";

export type Tooltip = ReturnType<typeof makeTooltip>;

export const makeTooltip = (div: HTMLDivElement) => {
  const root = select(document.body)
    .selectAll(".plotteus-tooltip")
    .data([null])
    .join("div")
    .attr("class", "plotteus-tooltip")
    .style("z-index", "999999")
    .style("position", "fixed")
    .style("top", 0)
    .style("left", 0)
    .style("max-width", "250px")
    .style("padding", "8px")
    .style("background", "#fcfcfcea")
    .style("font-size", "12px")
    .style("transform", "translate(-50%, calc(-100% - 16px))")
    .style("pointer-events", "none")
    .style("box-shadow", "0px 0px 48px 0px rgba(0, 0, 0, 0.15)")
    .style("opacity", 0);
  const content = root
    .selectAll(".content")
    .data([null])
    .join("div")
    .attr("class", "content")
    .style("overflow-wrap", "break-word")
    .style("color", "black");
  const datumLabel = content
    .selectAll(".datum-label")
    .data([null])
    .join("span")
    .attr("class", "datum-label");
  const valueLabel = content
    .selectAll(".value-label")
    .data([null])
    .join("span")
    .attr("class", "value-label")
    .style("font-weight", "bold");

  const show = (): void => {
    root.style("opacity", 1);
  };

  const hide = (): void => {
    root.style("opacity", 0);
  };

  const move = (x: number, y: number): void => {
    root.style("left", `${x}px`).style("top", `${y}px`);
  };

  const setText = ({
    label,
    value,
  }: {
    label: string;
    value: number | string;
  }): void => {
    datumLabel.text(label ? `${label}:` : "");
    valueLabel.text(` ${value}`);
  };

  return {
    node: root,
    show,
    move,
    hide,
    setText,
  };
};
