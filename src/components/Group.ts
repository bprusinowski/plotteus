import { getBarGetters } from "../charts/bar";
import { getBubbleGetters } from "../charts/bubble";
import { getPieGetters } from "../charts/pie";
import { getTreemapGetters } from "../charts/treemap";
import { ColorMap } from "../colors";
import { ResolvedDimensions } from "../dims";
import {
  BarChartSubtype,
  ChartType,
  InputGroup,
  MaxValue,
  TextDims,
} from "../types";
import { FONT_WEIGHT, stateOrderComparator } from "../utils";
import * as Datum from "./Datum";
import * as Generic from "./Generic";
import { Svg } from "./Svg";
import { Tooltip } from "./Tooltip";
import { getInts } from "./utils";

type G = {
  d: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  labelStrokeWidth: number;
  opacity: number;
};

export type Getter = Generic.Getter<G> & {
  data: Datum.Getter[];
};

export type GetterProps = {
  // Data.
  groups: InputGroup[];
  groupsKeys: string[];
  dataKeys: string[];
  // Scales.
  shareDomain: boolean;
  maxValue: MaxValue;
  // Labels.
  showValues: boolean;
  showDatumLabels: boolean;
  // Dimensions.
  svg: Svg;
  dims: ResolvedDimensions;
  textDims: TextDims;
  // Appearance.
  colorMap: ColorMap;
  cartoonize: boolean;
};

export const getters = (
  chartType: ChartType,
  chartSubtype: BarChartSubtype | undefined,
  props: GetterProps
): Getter[] => {
  switch (chartType) {
    case "bar":
      return getBarGetters(chartSubtype as BarChartSubtype, props);
    case "bubble":
      return getBubbleGetters(props);
    case "pie":
      return getPieGetters(props);
    case "treemap":
      return getTreemapGetters(props);
  }
};

export type Int = Generic.Int<G> & {
  data: Datum.Int[];
};

export const ints = ({
  getters = [],
  _getters,
  _ints,
}: {
  getters: Getter[] | undefined;
  _getters: Getter[] | undefined;
  _ints: Int[] | undefined;
}): Int[] => {
  const keys = getters.map((d) => d.key);
  const exitingGroups = _getters?.filter((d) => !keys.includes(d.key)) ?? [];
  const allGroups = getters.concat(exitingGroups);
  const ints: Int[] = allGroups.map(({ key, g, data }) => {
    const exiting = !keys.includes(key);
    const _int = _ints?.find((d) => d.key === key);
    const { state, i, _updateInt: _groupInt } = getInts({ _int, exiting, g });
    const groupInt: Int = {
      key,
      state,
      i,
      data: [],
    };

    const dataKeys = exiting ? [] : data.map((d) => d.key);
    const _data = _getters?.find((d) => d.key === key)?.data;
    const exitingData = _data?.filter((d) => !dataKeys.includes(d.key)) ?? [];
    const allData = data.concat(exitingData);
    groupInt.data = allData
      .map((datum) => {
        let _teleportInt: Datum.Int | undefined;
        const _groupTeleportInt = _ints?.find((d) => {
          return (_teleportInt = d.data.find(
            (d) => d.teleportKey === datum.teleportFrom
          ));
        });
        const _int =
          _teleportInt ?? _groupInt?.data?.find((d) => d.key === datum.key);

        return Datum.int({
          datum,
          _int,
          groupInt,
          _groupTeleportInt,
          exiting: !dataKeys.includes(datum.key),
          teleported: _teleportInt !== undefined,
        });
      })
      .sort(stateOrderComparator);

    return groupInt;
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

export type Resolved = Generic.Resolved<G> & {
  data: Datum.Resolved[];
};

export const resolve = (ints: Int[], t: number): Resolved[] => {
  return ints.map(({ key, i, data }) => {
    return { key, ...i(t), data: Datum.resolve(data, t) };
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
        tooltip.setText({
          label: d.key,
          value: d.value,
        });
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
    .style("font-size", (d) => d.labelFontSize)
    .style("font-weight", FONT_WEIGHT.groupLabel)
    .style("text-anchor", "middle")
    .style("dominant-baseline", "hanging")
    .style("user-select", "none")
    .style("pointer-events", "none")
    .text((d) => d.key);

  Datum.render({ dataSelection });
};
