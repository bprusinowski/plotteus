import { interpolate } from "d3-interpolate";
import { select, Selection } from "d3-selection";
import { FONT_WEIGHT } from "../utils";
import * as Generic from "./Generic";
import * as Group from "./Group";

export type G = {
  d: string;
  clipPath: string;
  x: number;
  y: number;
  rotate: number;
  fill: string;
  strokeWidth: number;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  labelFill: string;
  valueX: number;
  valueY: number;
  valueFontSize: number;
  valueFill: string;
  opacity: number;
};

export type Getter = Generic.Getter<
  G,
  | {
      type: "value";
      teleportKey: string;
      teleportFrom: string | undefined;
      value: number;
    }
  | {
      type: "xy";
      teleportKey: string;
      teleportFrom: string | undefined;
      xValue: number;
      yValue: number;
    }
>;

// Getters are defined per chart type in GroupsGetters.

export type Int = Generic.Int<
  G,
  | {
      type: "value";
      teleportKey: string;
      value: number;
      _value: number;
    }
  | {
      type: "xy";
      teleportKey: string;
      xValue: number;
      yValue: number;
    }
>;

export const ints = ({
  getters = [],
  _getters,
  _ints,
  getModifyPreviousG,
}: Generic.IntsProps<G, Getter, Int>) => {
  return Generic.ints<G, Getter, Int>()({
    getters,
    _getters,
    _ints,
    modifyInt: ({ getter, int, _updateInt }) => {
      switch (getter.type) {
        case "value":
          return {
            ...int,
            type: getter.type,
            teleportKey: getter.teleportKey,
            value: getter.value,
            _value:
              _updateInt?.type === "value"
                ? _updateInt?.value ?? getter.value
                : 0,
          };
        case "xy":
          return {
            ...int,
            type: getter.type,
            teleportKey: getter.teleportKey,
            xValue: getter.xValue,
            yValue: getter.yValue,
          };
      }
    },
    getModifyPreviousG,
  });
};

export type Resolved = Generic.Resolved<
  G,
  | { type: "value"; value: number }
  | { type: "xy"; xValue: number; yValue: number }
>;

export const resolve = ({
  ints,
  t,
}: {
  ints: Int[];
  t: number;
}): Resolved[] => {
  return Generic.resolve<G, Resolved, Int>()({
    ints,
    t,
    modifyResolved: ({ int, resolved }) => {
      switch (int.type) {
        case "value":
          return {
            ...resolved,
            type: int.type,
            value: interpolate(int._value, int.value)(Math.round(t)),
          };
        case "xy":
          return {
            ...resolved,
            type: int.type,
            xValue: int.xValue,
            yValue: int.yValue,
          };
      }
    },
  });
};

export const render = ({
  dataSelection,
}: {
  dataSelection: Selection<SVGGElement, Resolved, SVGGElement, Group.Resolved>;
}): void => {
  const pathSelection = dataSelection
    .selectAll<SVGPathElement, Resolved>(".shape")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("class", "shape")
    .attr("d", (d) => d.d)
    .style("stroke", "white")
    .style("stroke-width", (d) => d.strokeWidth)
    .style("fill", (d) => d.fill);

  const clipPathSelection = dataSelection
    .selectAll<SVGClipPathElement, Resolved>(".clip-path")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("clipPath")
    .attr("id", function (d) {
      const parentEl = this.parentNode?.parentNode as SVGGElement;
      const g = select(parentEl).datum() as Group.Resolved;
      return `clip${g.key}${d.key}`.replace(/[^a-zA-Z0-9]/g, "");
    })
    .attr("class", "clip-path")
    .selectAll<SVGPathElement, Resolved>("path")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("d", (d) => d.clipPath);

  const labelsSelection = dataSelection
    .selectAll<SVGGElement, Resolved>(".labels")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("g")
    .attr("class", "labels")
    .style("clip-path", function (d) {
      const parentEl = this.parentNode?.parentNode as SVGGElement;
      const g = select(parentEl).datum() as Group.Resolved;
      const clipPathId = `clip${g.key}${d.key}`.replace(/[^a-zA-Z0-9]/g, "");
      return `url(#${clipPathId})`;
    });

  const labelSelection = labelsSelection
    .selectAll<SVGTextElement, Resolved>(".label")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", "label")
    .attr("x", (d) => d.labelX)
    .attr("y", (d) => d.labelY)
    .attr("transform", (d) => `rotate(${360 - d.rotate})`)
    .style("font-size", (d) => d.labelFontSize)
    .style("font-weight", FONT_WEIGHT.datumLabel)
    .style("text-anchor", "middle")
    .style("dominant-baseline", "hanging")
    .style("user-select", "none")
    .style("pointer-events", "none")
    .style("letter-spacing", 1.5)
    .style("fill", (d) => d.labelFill)
    .text((d) => d.key);

  const valueSelection = labelsSelection
    .selectAll<SVGTextElement, Resolved>(".value")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", "value")
    .attr("x", (d) => d.valueX)
    .attr("y", (d) => d.valueY)
    .attr("transform", (d) => `rotate(${360 - d.rotate})`)
    .style("font-size", (d) => d.valueFontSize)
    .style("font-weight", FONT_WEIGHT.datumValue)
    .style("text-anchor", "middle")
    .style("dominant-baseline", "hanging")
    .style("user-select", "none")
    .style("pointer-events", "none")
    .style("fill", (d) => d.valueFill)
    .text((d) => (d.type === "value" ? d.value : ""));
};
