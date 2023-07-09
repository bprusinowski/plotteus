import { interpolate } from "d3-interpolate";
import { select, Selection } from "d3-selection";
import * as Generic from "../components/Generic";
import { FONT_WEIGHT } from "../utils";
import * as Chart from "./Chart";

export type G = {
  d: string;
  clipPath: string;
  x: number;
  y: number;
  rotate: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  labelStroke: string;
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
      type: "position";
      teleportKey: string;
      teleportFrom: string | undefined;
      positionValue: number;
    }
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

export type Int = Generic.Int<
  G,
  | {
      type: "position";
      teleportKey: string;
      teleportFrom: string | undefined;
      positionValue: number;
      _value: number;
    }
  | {
      type: "value";
      teleportKey: string;
      teleportFrom: string | undefined;
      value: number;
      _value: number;
    }
  | {
      type: "xy";
      teleportKey: string;
      teleportFrom: string | undefined;
      xValue: number;
      yValue: number;
      _value: number | undefined;
    }
>;

export const ints = ({
  getters = [],
  _getters,
  _ints,
  getPreviousInt,
}: Generic.IntsProps<G, Getter, Int>) => {
  return Generic.ints<G, Getter, Int>()({
    getters,
    _getters,
    _ints,
    modifyInt: ({ getter, int, _updateInt }) => {
      switch (getter.type) {
        case "position":
          return {
            ...int,
            type: getter.type,
            teleportKey: getter.teleportKey,
            teleportFrom: getter.teleportFrom,
            positionValue: getter.positionValue,
            _value:
              _updateInt?.type === "value"
                ? _updateInt?.value ?? getter.positionValue
                : // Keep artificial value as bubble size?
                  0,
          };
        case "value":
          return {
            ...int,
            type: getter.type,
            teleportKey: getter.teleportKey,
            teleportFrom: getter.teleportFrom,
            value: getter.value,
            _value:
              _updateInt?.type === "value"
                ? _updateInt?.value ?? getter.value
                : // Keep artificial value as bubble size?
                  0,
          };
        case "xy":
          return {
            ...int,
            type: getter.type,
            teleportKey: getter.teleportKey,
            teleportFrom: getter.teleportFrom,
            xValue: getter.xValue,
            yValue: getter.yValue,
            _value:
              _updateInt?.type === "value" ? _updateInt?.value : undefined,
          };
        default:
          const _exhaustiveCheck: never = getter;
          return _exhaustiveCheck;
      }
    },
    getPreviousInt,
  });
};

export type Resolved = Generic.Resolved<
  G,
  | {
      type: "position";
      value: number | undefined;
      positionValue: number;
    }
  | {
      type: "value";
      value: number;
    }
  | {
      type: "xy";
      xValue: number;
      yValue: number;
      // Potential preceding value if previous step was of value type.
      // Needed to nicely animate out the value.
      value: number | undefined;
    }
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
        case "position":
          return {
            ...resolved,
            type: int.type,
            positionValue: int.positionValue,
            ...getMaybeModifiedResolvedAfterTeleportation(int, resolved, t),
            ...getModifiedPrecedingValue(int, resolved, t),
          };
        case "value":
          return {
            ...resolved,
            type: int.type,
            value: interpolate(int._value, int.value)(Math.round(t)),
            ...getMaybeModifiedResolvedAfterTeleportation(int, resolved, t),
          };
        case "xy":
          return {
            ...resolved,
            type: int.type,
            xValue: int.xValue,
            yValue: int.yValue,
            ...getMaybeModifiedResolvedAfterTeleportation(int, resolved, t),
            ...getModifiedPrecedingValue(int, resolved, t),
          };
        default:
          const _exhaustiveCheck: never = int;
          return _exhaustiveCheck;
      }
    },
  });
};

const getMaybeModifiedResolvedAfterTeleportation = (
  int: Int,
  resolved: Generic.Resolved<G, {}>,
  t: number
) => {
  if (int.state === "update" && int.teleportFrom) {
    if (Math.round(t)) {
      return {
        key: int.key,
        labelFontSize: (t - 0.5) * 2 * resolved.labelFontSize,
      };
    } else {
      return {
        key: int.teleportFrom.split(":")[1],
        labelFontSize: (1 - t * 2) * resolved.labelFontSize,
      };
    }
  }

  return {};
};

const getModifiedPrecedingValue = (
  int: Int,
  resolved: Generic.Resolved<G, {}>,
  t: number
) => {
  if (Math.round(t)) {
    return {
      value: undefined,
      valueFontSize: 0,
    };
  } else {
    return {
      value: int._value,
      valueFontSize: (1 - t * 2) * resolved.valueFontSize,
    };
  }
};

export const render = ({
  dataSelection,
}: {
  dataSelection: Selection<SVGGElement, Resolved, SVGGElement, Chart.Resolved>;
}): void => {
  const pathSelection = dataSelection
    .selectAll<SVGPathElement, Resolved>(".plotteus-shape")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("class", "plotteus-shape")
    .attr("d", (d) => d.d)
    .style("stroke", (d) => d.stroke)
    .style("stroke-width", (d) => d.strokeWidth)
    .style("fill", (d) => d.fill);

  const clipPathSelection = dataSelection
    .selectAll<SVGClipPathElement, Resolved>(".plotteus-clip-path")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("clipPath")
    .attr("id", function (d) {
      const parentEl = this.parentNode?.parentNode as SVGGElement;
      const g = select(parentEl).datum() as Chart.Resolved;
      return `clip${g.key}${d.key}`.replace(/[^a-zA-Z0-9]/g, "");
    })
    .attr("class", "plotteus-clip-path")
    .selectAll<SVGPathElement, Resolved>("path")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("d", (d) => d.clipPath);

  const labelsSelection = dataSelection
    .selectAll<SVGGElement, Resolved>(".plotteus-labels")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("g")
    .attr("class", "plotteus-labels")
    .style("clip-path", function (d) {
      const parentEl = this.parentNode?.parentNode as SVGGElement;
      const g = select(parentEl).datum() as Chart.Resolved;
      const clipPathId = `clip${g.key}${d.key}`.replace(/[^a-zA-Z0-9]/g, "");
      return `url(#${clipPathId})`;
    });

  const labelSelection = labelsSelection
    .selectAll<SVGTextElement, Resolved>(".plotteus-label")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", "plotteus-label")
    .attr("x", (d) => d.labelX)
    .attr("y", (d) => d.labelY)
    .attr("transform", (d) => `rotate(${360 - d.rotate})`)
    .style("font-size", (d) => `${d.labelFontSize}px`)
    .style("font-weight", FONT_WEIGHT.datumLabel)
    .style("text-anchor", "middle")
    .style("dominant-baseline", "hanging")
    .style("paint-order", "stroke")
    .style("stroke", (d) => d.labelStroke)
    .style("stroke-width", 2)
    .style("user-select", "none")
    .style("pointer-events", "none")
    .style("fill", (d) => d.labelFill)
    .text((d) => d.key);

  const valueSelection = labelsSelection
    .selectAll<SVGTextElement, Resolved>(".plotteus-value")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", "plotteus-value")
    .attr("x", (d) => d.valueX)
    .attr("y", (d) => d.valueY)
    .attr("transform", (d) => `rotate(${360 - d.rotate})`)
    .style("font-size", (d) => `${d.valueFontSize}px`)
    .style("font-weight", FONT_WEIGHT.datumValue)
    .style("text-anchor", "middle")
    .style("dominant-baseline", "hanging")
    .style("user-select", "none")
    .style("pointer-events", "none")
    .style("fill", (d) => d.valueFill)
    .text((d) => d.value ?? "");
};
