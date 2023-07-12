import { scaleLinear } from "d3-scale";
import { Text } from ".";
import * as Chart from "../charts/Chart";
import { Dimensions, Margin } from "../dims";
import { AxisType } from "../types";
import { max } from "../utils";
import * as Tick from "./AxisTick";
import * as Generic from "./Generic";
import { SVGSelection, Svg } from "./Svg";

export type Info =
  | {
      show: true;
      title: string;
      tickFormat: (d: number) => string;
      minValue: number;
      maxValue: number;
      addTopMargin: boolean;
    }
  | {
      show: false;
    };

export const info = (type: AxisType, chartInfo: Chart.Info): Info => {
  switch (type) {
    case "vertical":
      switch (chartInfo.type) {
        case "bar":
          if (chartInfo.layout === "vertical") {
            return {
              show: chartInfo.verticalAxis?.show ?? chartInfo.groups.length > 0,
              title: chartInfo.verticalAxis?.title ?? "",
              tickFormat:
                chartInfo.verticalAxis?.tickFormat ?? Tick.defaultFormat,
              minValue: chartInfo.minValue,
              maxValue: chartInfo.maxValue.actual,
              addTopMargin:
                chartInfo.subtype === "grouped" && chartInfo.showValues,
            };
          } else {
            return { show: false };
          }
        case "beeswarm":
          if (chartInfo.layout === "vertical") {
            return {
              show: chartInfo.verticalAxis?.show ?? chartInfo.groups.length > 0,
              title: chartInfo.verticalAxis?.title ?? "",
              tickFormat:
                chartInfo.verticalAxis?.tickFormat ?? Tick.defaultFormat,
              minValue: chartInfo.minValue,
              maxValue: chartInfo.maxValue,
              addTopMargin: true,
            };
          } else {
            return { show: false };
          }
        case "scatter":
          return {
            show: chartInfo.verticalAxis?.show ?? true,
            title: chartInfo.verticalAxis?.title ?? "",
            tickFormat:
              chartInfo.verticalAxis?.tickFormat ?? Tick.defaultFormat,
            minValue: chartInfo.minValue.y.actual,
            maxValue: chartInfo.maxValue.y.actual,
            addTopMargin: false,
          };
      }
    case "horizontal":
      switch (chartInfo.type) {
        case "bar":
          if (chartInfo.layout === "horizontal") {
            return {
              show: chartInfo.horizontalAxis?.show ?? true,
              title: chartInfo.horizontalAxis?.title ?? "",
              tickFormat:
                chartInfo.horizontalAxis?.tickFormat ?? Tick.defaultFormat,
              minValue: 0,
              maxValue: chartInfo.maxValue.actual,
              addTopMargin: false,
            };
          } else {
            return { show: false };
          }
        case "beeswarm":
          if (chartInfo.layout === "horizontal") {
            return {
              show: chartInfo.horizontalAxis?.show ?? true,
              title: chartInfo.horizontalAxis?.title ?? "",
              tickFormat:
                chartInfo.horizontalAxis?.tickFormat ?? Tick.defaultFormat,
              minValue: chartInfo.minValue,
              maxValue: chartInfo.maxValue,
              addTopMargin: false,
            };
          } else {
            return { show: false };
          }
        case "scatter":
          return {
            show: chartInfo.horizontalAxis?.show ?? true,
            title: chartInfo.horizontalAxis?.title ?? "",
            tickFormat:
              chartInfo.horizontalAxis?.tickFormat ?? Tick.defaultFormat,
            minValue: chartInfo.minValue.x.actual,
            maxValue: chartInfo.maxValue.x.actual,
            addTopMargin: false,
          };
      }
    default:
      return { show: false };
  }
};

type G = {
  x: number;
  y: number;
  opacity: number;
};

export type Getter = Generic.Getter<
  G,
  {
    title: Text.Getter | undefined;
    ticks: Tick.Getter[];
  }
>;

export const getters = ({
  type,
  title,
  titleMargin,
  svg,
  svgBackgroundColor,
  dims,
  tickHeight,
  ticksCount,
  tickFormat,
  minValue,
  _minValue,
  maxValue,
  _maxValue,
}: {
  type: AxisType;
  title: string;
  titleMargin: Margin;
  svg: Svg;
  svgBackgroundColor: string;
  dims: Dimensions;
  tickHeight: number;
  ticksCount: number;
  tickFormat: (d: number) => string;
  minValue: number;
  _minValue: number | undefined;
  maxValue: number;
  _maxValue: number | undefined;
}): Getter => {
  const resolvedDims = dims.resolve();
  const ticks = scaleLinear().domain([minValue, maxValue]).ticks(ticksCount);
  const titleDims = svg.measureText(title, "axisTitle", {
    paddingLeft: dims.BASE_MARGIN,
    paddingRight: dims.BASE_MARGIN,
  });
  const titleGetter = title
    ? Text.getter({
        text: title,
        type: "axisTitle",
        anchor: type === "vertical" ? "start" : "end",
        svg,
        svgBackgroundColor,
        resolvedDims: { ...resolvedDims, margin: titleMargin },
        textDims: titleDims,
      })
    : undefined;

  return {
    key: `${type}-axis`,
    g: ({ s, _g }) => {
      const x = dims.margin.left;
      let y: number;
      switch (type) {
        case "vertical":
          y = dims.margin.top;
          break;
        case "horizontal":
          y = dims.fullHeight - dims.margin.bottom;
          break;
      }

      const g: G = {
        x: s(x, null, _g?.x),
        y: s(y, null, _g?.y),
        opacity: s(0, 1),
      };

      return g;
    },
    title: titleGetter,
    ticks: Tick.getters({
      axisType: type,
      ticks,
      minValue,
      _minValue,
      maxValue,
      _maxValue,
      tickHeight,
      tickFormat,
      dims: resolvedDims,
      svgBackgroundColor,
    }),
  };
};

export type Int = Generic.Int<G, { titles: Text.Int[]; ticks: Tick.Int[] }>;

export const ints = ({
  getters,
  _getters,
  _ints,
}: Generic.IntsProps<G, Getter, Int>) => {
  return Generic.ints<G, Getter, Int>()({
    getters,
    _getters,
    _ints,
    modifyInt: ({ getter, int, _updateInt }) => {
      const _getter = _getters?.find((d) => d.key === getter.key);
      const _titleGetter = _getter?.title;
      const _tickGetters = _getter?.ticks;

      return {
        ...int,
        titles: Text.ints({
          getters: getter.title ? [getter.title] : [],
          _getters: _titleGetter ? [_titleGetter] : [],
          _ints: _updateInt?.titles,
        }),
        ticks: Tick.ints({
          getters: getter.ticks,
          _getters: _tickGetters,
          _ints: _updateInt?.ticks,
        }),
      };
    },
  });
};

export type Resolved = Generic.Resolved<
  G,
  { titles: Text.Resolved[]; ticks: Tick.Resolved[] }
>;

export const resolve = ({ ints, t }: { ints: Int[]; t: number }) => {
  return Generic.resolve<G, Resolved, Int>()({
    ints,
    t,
    modifyResolved: ({ int, resolved }) => {
      return {
        ...resolved,
        titles: Text.resolve({ ints: int.titles, t }),
        ticks: Tick.resolve({ ints: int.ticks, t }),
      };
    },
  });
};

export const render = ({
  resolved,
  selection,
  type,
}: {
  resolved: Resolved[];
  selection: SVGSelection;
  type: AxisType;
}) => {
  const titles = resolved.flatMap((d) => d.titles);
  const ticks = resolved.flatMap((d) => d.ticks);

  const verticalAxisSelection = selection
    .selectAll<SVGGElement, Resolved>(`.plotteus-${type}-axis`)
    .data(resolved)
    .join("g")
    .attr("class", `plotteus-${type}-axis`)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", (d) => d.opacity)
    // Vertical axis needs to be the first element in SVG, so it doesn't overlap bars.
    .lower();

  Text.render({
    resolved: titles,
    key: "title",
    selection: verticalAxisSelection,
  });
  Tick.render({
    resolved: ticks,
    selection: verticalAxisSelection,
    axisType: type,
  });
};

export const updateDims = ({
  type,
  dims,
  svg,
  maxValue,
  minValue,
  titleHeight,
  tickHeight,
  ticksCount,
  tickFormat,
  addTopMargin,
}: {
  type: AxisType;
  dims: Dimensions;
  svg: Svg;
  minValue: number;
  maxValue: number;
  titleHeight: number;
  tickHeight: number;
  ticksCount: number;
  tickFormat: (d: number) => string;
  addTopMargin: boolean;
}): void => {
  const width = getWidth({ svg, ticksCount, tickFormat, minValue, maxValue });

  switch (type) {
    case "horizontal":
      dims
        .addRight(width * 0.5)
        .addBottom(titleHeight)
        .addBottom(tickHeight + Tick.SIZE + Tick.LABEL_MARGIN);
      break;
    case "vertical":
      dims
        .addLeft(width + Tick.SIZE + Tick.LABEL_MARGIN)
        .addTop(titleHeight)
        .addTop(addTopMargin ? dims.BASE_MARGIN : 0);
      break;
  }
};

export const getTicksCount = (size: number): number => {
  return Math.max(2, Math.min(5, Math.floor(size / 50)));
};

export const getWidth = ({
  svg,
  ticksCount,
  tickFormat,
  minValue,
  maxValue,
}: {
  svg: Svg;
  ticksCount: number;
  tickFormat: (d: number) => string;
  minValue: number;
  maxValue: number;
}): number => {
  const ticks = scaleLinear()
    .domain([minValue, maxValue])
    .nice()
    .ticks(ticksCount);
  const ticksWidths = ticks.map((d) => {
    return svg.measureText(tickFormat(d), "axisTick").width;
  });

  return max(ticksWidths) as number;
};
