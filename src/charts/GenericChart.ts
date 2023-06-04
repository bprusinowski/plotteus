import { ColorMap } from "../colors";
import * as Datum from "../components/Datum";
import * as Generic from "../components/Generic";
import { Svg } from "../components/Svg";
import { Tooltip } from "../components/Tooltip";
import { ResolvedDimensions } from "../dims";
import { TextDims } from "../types";
import { FONT_WEIGHT, stateOrderComparator } from "../utils";

export type G = {
  d: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  labelStrokeWidth: number;
  opacity: number;
};

export type Getter = Generic.Getter<G, { data: Datum.Getter[] }>;

export type BaseGetterProps = {
  groupsKeys: string[];
  dataKeys: string[];
  shareDomain: boolean;
  showValues: boolean;
  showDatumLabels: boolean;
  svg: Svg;
  dims: ResolvedDimensions;
  textDims: TextDims;
  colorMap: ColorMap;
  cartoonize: boolean;
};

export type Int = Generic.Int<G, { data: Datum.Int[] }>;

export const ints = ({
  getters = [],
  _getters,
  _ints,
}: Generic.IntsProps<G, Getter, Int>): Int[] => {
  const ints = Generic.ints<G, Getter, Int>()({
    getters,
    _getters,
    _ints,
    modifyInt: ({ getter, int, exiting, _updateInt }) => {
      const _data = _getters?.find((d) => d.key === getter.key)?.data;
      const newInt: Int = {
        ...int,
        data: [],
      };

      const getPreviousDatumInt: Generic.IntsProps<
        Datum.G,
        Datum.Getter,
        Datum.Int
      >["getPreviousInt"] = ({ getter }) => {
        return _ints
          ?.flatMap((d) => d.data)
          .find((d) => d.teleportKey === getter.teleportFrom);
      };

      newInt.data = Datum.ints({
        getters: exiting ? [] : getter.data,
        _getters: _data,
        _ints: _updateInt?.data,
        getPreviousInt: getPreviousDatumInt,
        getModifyPreviousG: ({ getter }) => {
          let _teleportInt: Datum.Int | undefined;
          const _groupTeleportInt = _ints?.find((d) => {
            return (_teleportInt = d.data.find(
              (d) => d.teleportKey === getter.teleportFrom
            ));
          });

          // Update datum's x and y by their groups' coords when teleporting.
          const modifyPreviousG =
            _teleportInt && _groupTeleportInt
              ? (_g: Datum.G) => {
                  const g = newInt.i(1);
                  const _gt = _groupTeleportInt.i(1);
                  _g.x += _gt.x - g.x;
                  _g.y += _gt.y - g.y;
                }
              : undefined;

          return modifyPreviousG;
        },
      }).sort(stateOrderComparator);

      return newInt;
    },
  });

  const allDataTeleportFrom = getters
    .map((d) => d.data)
    .flat()
    .filter((d) => d.teleportFrom !== undefined)
    .map((d) => d.teleportFrom) as string[];

  // Remove teleported data from original groups.
  ints.forEach((groupInts) => {
    groupInts.data = groupInts.data.filter((datumInts) => {
      return !allDataTeleportFrom.includes(datumInts.teleportKey);
    });
  });

  return ints;
};

export type Resolved = Generic.Resolved<G, { data: Datum.Resolved[] }>;

export const resolve = ({ ints, t }: { ints: Int[]; t: number }) => {
  return Generic.resolve<G, Resolved, Int>()({
    ints,
    t,
    modifyResolved: ({ int, resolved }) => {
      return {
        ...resolved,
        data: Datum.resolve({ ints: int.data, t }),
      };
    },
  });
};

export const render = ({
  resolved,
  svg,
  tooltip,
}: {
  resolved: Resolved[];
  svg: Svg;
  tooltip?: Tooltip;
}): void => {
  const groupsSelection = svg.selection
    .selectAll<SVGGElement, null>(".groups")
    .data([null])
    .join("g")
    .attr("class", "groups")
    .selectAll<SVGGElement, Resolved>(".group")
    .data(resolved, (d) => d.key)
    .join("g")
    .attr("class", "group")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", (d) => d.opacity);

  const backgroundsSelection = groupsSelection
    .selectAll<SVGPathElement, Resolved>(".background")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("class", "background")
    .style("fill", "#f5f5f5")
    .attr("d", (d) => d.d);

  const dataSelection = groupsSelection
    .selectAll<SVGGElement, Resolved>(".data")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("g")
    .attr("class", "data")
    .selectAll<SVGGElement, Resolved>(".datum")
    .data(
      (d) => d.data,
      (d) => d.key
    )
    .join("g")
    .attr("class", "datum")
    .attr("transform", (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
    .style("opacity", (d) => d.opacity);

  if (tooltip) {
    dataSelection
      .on("mouseover mousemove", function (e: MouseEvent, d) {
        tooltip.move(e.clientX, e.clientY);

        switch (d.type) {
          case "value":
            tooltip.setText({
              label: d.key,
              value: d.value,
            });
            break;
          case "xy":
            tooltip.setText({
              label: d.key,
              value: `(${d.xValue}, ${d.yValue})`,
            });
            break;
        }

        tooltip.show();
      })
      .on("mouseout", function () {
        tooltip.hide();
      });
  } else {
    dataSelection.on("mouseover mousemove mouseout", null);
  }

  const labelsSelection = groupsSelection
    .selectAll<SVGTextElement, Resolved>(".label")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", "label")
    .attr("x", (d) => d.labelX)
    .attr("y", (d) => d.labelY)
    .style("fill", "#333333")
    .style("paint-order", "stroke")
    .style("stroke", "white")
    .style("stroke-width", (d) => d.labelStrokeWidth)
    .style("stroke-linecap", "round")
    .style("stroke-linejoin", "round")
    .style("font-size", (d) => `${d.labelFontSize}px`)
    .style("font-weight", FONT_WEIGHT.groupLabel)
    .style("text-anchor", "middle")
    .style("dominant-baseline", "hanging")
    .style("user-select", "none")
    .style("pointer-events", "none")
    .text((d) => d.key);

  Datum.render({ dataSelection });
};
