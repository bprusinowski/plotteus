import {
  BarChart,
  BeeswarmChart,
  BubbleChart,
  PieChart,
  ScatterChart,
  TreemapChart,
} from ".";
import * as Story from "..";
import { ColorMap } from "../colors";
import * as Generic from "../components/Generic";
import { Svg } from "../components/Svg";
import { Tooltip } from "../components/Tooltip";
import { Dimensions, ResolvedDimensions } from "../dims";
import { InputStep, TextTypeDims } from "../types";
import { FONT_WEIGHT, stateOrderComparator, unique } from "../utils";
import * as Datum from "./Datum";

export type BaseInfo = {
  groupsKeys: string[];
  dataKeys: string[];
  shareDomain: boolean;
  showValues: boolean;
  svgBackgroundColor: string;
};

export const baseInfo = (
  svgBackgroundColor: string,
  inputStep: InputStep,
  shareDomain: boolean
): BaseInfo => {
  const groupsKeys = inputStep.groups.map((d) => d.key);
  const dataKeys = unique(
    inputStep.groups.flatMap((d) => d.data.map((d) => d.key))
  );
  const showValues = inputStep.showValues ?? false;

  return { groupsKeys, dataKeys, shareDomain, showValues, svgBackgroundColor };
};

export const info = (
  storyInfo: Story.Info,
  svgBackgroundColor: string,
  inputStep: InputStep,
  dims: Dimensions
) => {
  switch (inputStep.chartType) {
    case "bar":
      return BarChart.info(storyInfo, svgBackgroundColor, inputStep, dims);
    case "beeswarm":
      return BeeswarmChart.info(storyInfo, svgBackgroundColor, inputStep);
    case "bubble":
      return BubbleChart.info(storyInfo, svgBackgroundColor, inputStep);
    case "pie":
      return PieChart.info(storyInfo, svgBackgroundColor, inputStep);
    case "scatter":
      return ScatterChart.info(storyInfo, svgBackgroundColor, inputStep);
    case "treemap":
      return TreemapChart.info(storyInfo, svgBackgroundColor, inputStep);
    default:
      const _exhaustiveCheck: never = inputStep;
      return _exhaustiveCheck;
  }
};

export type Info = ReturnType<typeof info>;

export const updateDims = (info: Info, dims: Dimensions, svg: Svg) => {
  switch (info.type) {
    case "bar":
      return BarChart.updateDims(info, dims, svg);
    case "beeswarm":
      return BeeswarmChart.updateDims(dims);
    case "bubble":
      return BubbleChart.updateDims(dims);
    case "pie":
      return PieChart.updateDims(dims);
    case "scatter":
      return ScatterChart.updateDims(dims);
    case "treemap":
      return TreemapChart.updateDims(dims);
    default:
      const _exhaustiveCheck: never = info;
      return _exhaustiveCheck;
  }
};

export type G = {
  d: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  labelStroke: string;
  labelStrokeWidth: number;
  labelFill: string;
  labelRotate: number;
  fill: string;
  opacity: number;
};

export type Getter = Generic.Getter<G, { data: Datum.Getter[] }>;

export type GetterProps = {
  showDatumLabels: boolean;
  svg: Svg;
  dims: ResolvedDimensions;
  textTypeDims: TextTypeDims;
  colorMap: ColorMap;
  cartoonize: boolean;
};

export const getters = (info: Info, props: GetterProps): Getter[] => {
  switch (info.type) {
    case "bar":
      return BarChart.getters(info, props);
    case "beeswarm":
      return BeeswarmChart.getters(info, props);
    case "bubble":
      return BubbleChart.getters(info, props);
    case "pie":
      return PieChart.getters(info, props);
    case "scatter":
      return ScatterChart.getters(info, props);
    case "treemap":
      return TreemapChart.getters(info, props);
    default:
      const _exhaustiveCheck: never = info;
      return _exhaustiveCheck;
  }
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
    .selectAll<SVGGElement, null>(".plotteus-groups")
    .data([null])
    .join("g")
    .attr("class", "plotteus-groups")
    .selectAll<SVGGElement, Resolved>(".plotteus-group")
    .data(resolved, (d) => d.key)
    .join("g")
    .attr("class", "plotteus-group")
    .style("opacity", (d) => d.opacity);

  const backgroundsSelection = groupsSelection
    .selectAll<SVGPathElement, Resolved>(".plotteus-background")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("path")
    .attr("class", "plotteus-background")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("fill", (d) => d.fill)
    .attr("d", (d) => d.d);

  const dataSelection = groupsSelection
    .selectAll<SVGGElement, Resolved>(".plotteus-data")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("g")
    .attr("class", "plotteus-data")
    .selectAll<SVGGElement, Resolved>(".plotteus-datum")
    .data(
      (d) => d.data,
      (d) => d.key
    )
    .join("g")
    .attr("class", "plotteus-datum")
    .attr("transform", (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
    .style("opacity", (d) => d.opacity);

  if (tooltip) {
    dataSelection
      .on("mouseover mousemove", function (e: MouseEvent, d) {
        tooltip.move(e.clientX, e.clientY);

        switch (d.type) {
          case "position":
            tooltip.setText({
              label: d.key,
              value: d.positionValue,
            });
            break;
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
          default:
            const _exhaustiveCheck: never = d;
            return _exhaustiveCheck;
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
    .selectAll<SVGTextElement, Resolved>(".plotteus-group-label")
    .data(
      (d) => [d],
      (d) => d.key
    )
    .join("text")
    .attr("class", "plotteus-group-label")
    .attr(
      "transform",
      (d) => `translate(${d.labelX}, ${d.labelY}) rotate(${d.labelRotate}) `
    )
    .style("fill", (d) => d.labelFill)
    .style("paint-order", "stroke")
    .style("stroke", (d) => d.labelStroke)
    .style("stroke-width", (d) => d.labelStrokeWidth)
    .style("stroke-linecap", "round")
    .style("stroke-linejoin", "round")
    .style("font-size", (d) => `${d.labelFontSize}px`)
    .style("font-weight", FONT_WEIGHT.groupLabel)
    .style("text-anchor", "middle")
    .style("user-select", "none")
    .style("pointer-events", "none")
    .text((d) => d.key);

  Datum.render({ dataSelection });
};
