import { scaleLinear } from "d3-scale";
import { Text } from ".";
import { Margin, ResolvedDimensions } from "../dims";
import { GenericInt, GProps, State } from "../types";
import { FONT_WEIGHT, max } from "../utils";
import { Svg } from "./Svg";
import * as Tick from "./Tick";
import { prepareInts } from "./utils";
import style from "./VerticalAxis.module.scss";

type G = {
  x: number;
  y: number;
  opacity: number;
};

export type Getter = {
  title: Text.Getter;
  g: (props: GProps<G>) => G;
  ticks: Tick.Getter[];
};

export const getters = ({
  svg,
  title,
  maxValue,
  _maxValue,
  dims,
  titleMargin,
  tickHeight,
}: {
  svg: Svg;
  title: string;
  maxValue: number;
  _maxValue: number | undefined;
  dims: ResolvedDimensions;
  // As we are using Text to get title getter, we need to pass a custom margin
  // relative to vertical axis.
  titleMargin: Margin;
  tickHeight: number;
}): Getter => {
  const ticks = scaleLinear().domain([0, maxValue]).ticks(5);

  return {
    title: Text.getter({
      svg,
      text: title,
      textType: "verticalAxisTitle",
      anchor: "start",
      dims: { ...dims, margin: titleMargin },
    }),
    g: ({ s, _g }) => {
      const x = dims.margin.left;
      const y = dims.margin.top;

      return {
        x: s(x, null, _g?.x),
        y: s(y, null, _g?.y),
        opacity: s(0, 1),
      };
    },
    ticks: Tick.getters({ ticks, maxValue, _maxValue, dims, tickHeight }),
  };
};

export type Int = {
  titles: Text.Int[];
  state: State;
  i: GenericInt<G>;
  ticks: Tick.Int[];
};

export const ints = ({
  verticalAxis,
  _verticalAxis,
  _verticalAxisInts,
}: {
  verticalAxis: Getter | undefined;
  _verticalAxis: Getter | undefined;
  _verticalAxisInts: Int[] | undefined;
}): Int[] => {
  const exitingVerticalAxis = _verticalAxis ? [_verticalAxis] : [];
  const allVerticalAxes = verticalAxis ? [verticalAxis] : exitingVerticalAxis;
  const verticalAxisInts: Int[] = allVerticalAxes.map(({ title, g, ticks }) => {
    const exiting = verticalAxis === undefined;
    const _int = _verticalAxisInts?.find((d) => d.state !== "exit");
    const {
      state,
      i,
      _updateInt: _verticalAxisInt,
    } = prepareInts({ _int, exiting, g });
    const verticalAxisInt: Int = {
      titles: Text.ints({
        text: title,
        _text: _verticalAxis?.title,
        _textInts: _verticalAxisInt?.titles,
      }),
      state,
      i,
      ticks: Tick.ints({
        ticks,
        _ticks: _verticalAxis?.ticks,
        _tickInts: _verticalAxisInt?.ticks,
      }),
    };

    return verticalAxisInt;
  });

  return verticalAxisInts;
};

export type Resolved = {
  titles: Text.Resolved[];
  ticks: Tick.Resolved[];
} & G;

export const resolve = (ints: Int[], t: number): Resolved[] => {
  return ints.map(({ titles, i, ticks }) => {
    return {
      titles: Text.resolve(titles, t),
      ...i(t),
      ticks: Tick.resolve(ticks, t),
    };
  });
};

export const render = ({
  resolved,
  svg,
}: {
  resolved: Resolved[];
  svg: Svg;
}): void => {
  const verticalAxisSelection = svg.selection
    .selectAll<SVGGElement, Resolved>(`.${style.node}`)
    .data(resolved)
    .join("g")
    .attr("class", style.node)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("opacity", (d) => d.opacity)
    // Vertical axis needs to be the first element in SVG, so it doesn't overlap bars.
    .lower();

  const titlesSelection = verticalAxisSelection
    .selectAll(`.${style.titleNode}`)
    .data((d) => [d])
    .join("g")
    .attr("class", style.titleNode)
    .selectAll(`.${style.title}`)
    .data((d) => d.titles)
    .join("text")
    .attr("class", style.title)
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("font-size", (d) => d.fontSize)
    .style("font-weight", FONT_WEIGHT.verticalAxisTitle)
    .style("opacity", (d) => d.opacity)
    .text((d) => d.key);

  Tick.render(verticalAxisSelection);
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
