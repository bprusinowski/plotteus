import { scaleLinear } from "d3-scale";
import { Text } from ".";
import { Dimensions, Margin, ResolvedDimensions } from "../dims";
import { AxisType } from "../types";
import { max } from "../utils";
import * as Tick from "./AxisTick";
import * as Generic from "./Generic";
import { Svg, SVGSelection } from "./Svg";

type G = {
  x: number;
  y: number;
  opacity: number;
};

export type Getter = Generic.Getter<
  G,
  { title: Text.Getter | undefined; ticks: Tick.Getter[] }
>;

export const getters = ({
  type,
  title,
  titleMargin,
  svg,
  dims,
  tickHeight,
  maxValue,
  _maxValue,
}: {
  type: AxisType;
  title: string;
  titleMargin: Margin;
  svg: Svg;
  dims: ResolvedDimensions;
  tickHeight: number;
  maxValue: number;
  _maxValue: number | undefined;
}): Getter => {
  const ticks = scaleLinear().domain([0, maxValue]).ticks(5);

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

      return {
        x: s(x, null, _g?.x),
        y: s(y, null, _g?.y),
        opacity: s(0, 1),
      };
    },
    title: title
      ? Text.getter({
          text: title,
          type: "axisTitle",
          anchor: type === "vertical" ? "start" : "end",
          svg,
          dims: { ...dims, margin: titleMargin },
        })
      : undefined,
    ticks: Tick.getters({
      axisType: type,
      ticks,
      maxValue,
      _maxValue,
      tickHeight,
      dims,
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
    .selectAll<SVGGElement, Resolved>(`.${type}-axis`)
    .data(resolved)
    .join("g")
    .attr("class", `${type}-axis`)
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
  titleHeight,
  tickHeight,
}: {
  type: AxisType;
  dims: Dimensions;
  svg: Svg;
  maxValue: number;
  titleHeight: number;
  tickHeight: number;
}): void => {
  const width = getWidth({ svg, maxValue });

  switch (type) {
    case "horizontal":
      dims
        .addRight(width * 0.5)
        .addBottom(titleHeight)
        .addBottom(tickHeight + Tick.SIZE + Tick.LABEL_MARGIN);
      break;
    case "vertical":
      dims.addLeft(width + Tick.SIZE + Tick.LABEL_MARGIN).addTop(titleHeight);
      break;
  }
};

export const getWidth = ({
  svg,
  maxValue,
}: {
  svg: Svg;
  maxValue: number;
}): number => {
  const ticks = scaleLinear().domain([0, maxValue]).nice().ticks(5);
  const ticksWidths = ticks.map((d) => {
    return svg.measureText(d, "axisTick").width;
  });

  return max(ticksWidths) as number;
};
