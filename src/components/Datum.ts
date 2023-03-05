import { interpolate } from "d3-interpolate";
import { select, Selection } from "d3-selection";
import { FONT_WEIGHT } from "../utils";
import style from "./Datum.module.scss";
import * as Generic from "./Generic";
import * as Group from "./Group";
import { getInts } from "./utils";

type G = {
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

export type Getter = Generic.Getter<G> & {
  teleportKey: string;
  teleportFrom: string | undefined;
  value: number;
};

// Getters are defined per chart type in GroupsGetters.

export type Int = Generic.Int<G> & {
  teleportKey: string;
  value: number;
  _value: number;
};

export const int = ({
  datum,
  _int,
  groupInt,
  _groupTeleportInt,
  exiting,
  teleported,
}: {
  datum: Getter;
  _int: Int | undefined;
  groupInt: Group.Int;
  _groupTeleportInt: Group.Int | undefined;
  exiting: boolean;
  teleported: boolean;
}): Int => {
  const { key, teleportKey, value, g } = datum;
  // Update datum's x and y by their groups' coords when teleporting.
  const _gAlter =
    teleported && _groupTeleportInt && _int
      ? (_g: G) => {
          const g = groupInt.i(1);
          const _gt = _groupTeleportInt.i(1);
          _g.x += _gt.x - g.x;
          _g.y += _gt.y - g.y;
        }
      : undefined;
  const { state, i, _updateInt } = getInts({ _int, exiting, g, _gAlter });
  const _value = _updateInt?.value ?? value;

  return {
    key,
    teleportKey,
    state,
    value,
    _value,
    i,
  };
};

export type Resolved = Generic.Resolved<G> & {
  value: number;
  fill: string;
};

export const resolve = (ints: Int[], t: number): Resolved[] => {
  return ints.map(({ key, value, _value, i }) => {
    return {
      key,
      value: interpolate(_value, value)(Math.round(t)),
      ...i(t),
    };
  });
};

export const render = ({
  dataSelection,
}: {
  dataSelection: Selection<SVGGElement, Resolved, SVGGElement, Group.Resolved>;
}): void => {
  const pathSelection = dataSelection
    .selectAll<SVGPathElement, Resolved>(`.${style.path}`)
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("class", style.path)
    .attr("d", (d) => d.d)
    .style("stroke-width", (d) => d.strokeWidth)
    .style("fill", (d) => d.fill);

  const clipPathSelection = dataSelection
    .selectAll<SVGClipPathElement, Resolved>(`.${style.clipPath}`)
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
    .attr("class", style.clipPath)
    .selectAll<SVGPathElement, Resolved>("path")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("d", (d) => d.clipPath);

  const labelsSelection = dataSelection
    .selectAll<SVGGElement, Resolved>(`.${style.labels}`)
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("g")
    .attr("class", style.labels)
    .style("clip-path", function (d) {
      const parentEl = this.parentNode?.parentNode as SVGGElement;
      const g = select(parentEl).datum() as Group.Resolved;
      const clipPathId = `clip${g.key}${d.key}`.replace(/[^a-zA-Z0-9]/g, "");
      return `url(#${clipPathId})`;
    });

  const labelSelection = labelsSelection
    .selectAll<SVGTextElement, Resolved>(`.${style.label}`)
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", style.label)
    .attr("x", (d) => d.labelX)
    .attr("y", (d) => d.labelY)
    .attr("transform", (d) => `rotate(${360 - d.rotate})`)
    .style("font-size", (d) => d.labelFontSize)
    .style("font-weight", FONT_WEIGHT.datumLabel)
    .style("fill", (d) => d.labelFill)
    .text((d) => d.key);

  const valueSelection = labelsSelection
    .selectAll<SVGTextElement, Resolved>(`.${style.value}`)
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", style.value)
    .attr("x", (d) => d.valueX)
    .attr("y", (d) => d.valueY)
    .attr("transform", (d) => `rotate(${360 - d.rotate})`)
    .style("font-size", (d) => d.valueFontSize)
    .style("font-weight", FONT_WEIGHT.datumValue)
    .style("fill", (d) => d.valueFill)
    .text((d) => d.value);
};
