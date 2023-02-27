import { select } from "d3-selection";
import style from "./Tooltip.module.scss";

export type Tooltip = ReturnType<typeof makeTooltip>;

export const makeTooltip = (div: HTMLDivElement) => {
  const root = select(div)
    .append("div")
    .attr("class", style.root)
    .style("opacity", 0);
  const content = root.append("div").attr("class", style.content);
  const datumLabel = content.append("span").attr("class", style.datumLabel);
  const valueLabel = content.append("span").attr("class", style.valueLabel);

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
    value: number;
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
