import { scaleLinear } from "d3-scale";
import { Text } from ".";
import { Margin, ResolvedDimensions } from "../dims";
import { max } from "../utils";
import * as Generic from "./Generic";
import { Svg, SVGSelection } from "./Svg";
import * as Tick from "./Tick";

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
  title,
  titleMargin,
  svg,
  dims,
  tickHeight,
  maxValue,
  _maxValue,
}: {
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
    key: "verticalAxis",
    g: ({ s, _g }) => {
      return {
        x: s(dims.margin.left, null, _g?.x),
        y: s(dims.margin.top, null, _g?.y),
        opacity: s(0, 1),
      };
    },
    title: title
      ? Text.getter({
          text: title,
          textType: "verticalAxisTitle",
          anchor: "start",
          svg,
          dims: { ...dims, margin: titleMargin },
        })
      : undefined,
    ticks: Tick.getters({
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
      const _titleGetter = _getters?.find((d) => d.key === getter.key)?.title;
      const _tickGetters = _getters?.find((d) => d.key === getter.key)?.ticks;

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
}: {
  resolved: Resolved[];
  selection: SVGSelection;
}) => {
  const titles = resolved.flatMap((d) => d.titles);
  const ticks = resolved.flatMap((d) => d.ticks);

  const verticalAxisSelection = selection
    .selectAll<SVGGElement, Resolved>(".vertical-axis")
    .data(resolved)
    .join("g")
    .attr("class", "vertical-axis")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", (d) => d.opacity)
    // Vertical axis needs to be the first element in SVG, so it doesn't overlap bars.
    .lower();

  Text.render({
    resolved: titles,
    key: "verticalAxisTitle",
    selection: verticalAxisSelection,
  });
  Tick.render({
    resolved: ticks,
    selection: verticalAxisSelection,
  });
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
    return svg.measureText(d, "tick").width;
  });

  return (max(ticksWidths) as number) + Tick.WIDTH;
};
