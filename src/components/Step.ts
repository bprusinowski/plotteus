import { ColorLegend, Group, Svg, Text, Tooltip, VerticalAxis } from ".";
import { ColorMap } from "../colors";
import { Dimensions } from "../dims";
import { InputStep, MaxValue } from "../types";
import { getTextDims, max, stateOrderComparator, unique } from "../utils";
import { shouldShareDomain } from "./utils";

export type Getter = {
  key: string;
  title: Text.Getter | undefined;
  subtitle: Text.Getter | undefined;
  groups: Group.Getter[];
  colorLegends: ColorLegend.Getter[] | undefined;
  verticalAxis: VerticalAxis.Getter | undefined;
};

export const getters = ({
  steps: inputSteps,
  svg,
  width,
  height,
}: {
  steps: InputStep[];
  svg: Svg;
  width: number;
  height: number;
}): Getter[] => {
  const steps: Getter[] = [];
  let _showVerticalAxis: boolean | undefined;
  let _maxValue: number | undefined;
  const textDims = getTextDims(svg);

  for (const step of inputSteps) {
    const {
      key,
      chartType,
      groups,
      title,
      titleAnchor = "start",
      subtitle,
      subtitleAnchor = "start",
      shareDomain: inputShareDomain,
      showLegend: inputShowLegend,
      legendTitle = "",
      legendAnchor = "middle",
      showValues = false,
      maxValue: inputMaxValue,
      showDatumLabels = false,
      palette: paletteName = "default",
      cartoonize = false,
    } = step;

    const chartSubtype =
      step.chartType === "bar" ? step.chartSubtype ?? "grouped" : undefined;

    // TODO: if bar is a preceding step to pie, it can already be pre-rotated,
    // so animation will be smoother.

    const groupsKeys = groups.map((d) => d.key);
    const dataKeys = unique(groups.map((d) => d.data.map((d) => d.key)).flat());

    let dataMaxValue = 0;

    if (chartSubtype !== "stacked") {
      dataMaxValue =
        max(groups.map((d) => max(d.data.map((d) => d.value)) ?? 0)) ?? 0;
    } else {
      // Sum values by group for stacked bar chart.
      for (const group of groups) {
        const sum = group.data.map((d) => d.value).reduce((a, b) => a + b, 0);

        if (sum > dataMaxValue) {
          dataMaxValue = sum;
        }
      }
    }

    const k = inputMaxValue !== undefined ? dataMaxValue / inputMaxValue : 1;
    const maxValue: MaxValue = {
      data: dataMaxValue,
      scale: inputMaxValue,
      actual: inputMaxValue ?? dataMaxValue,
      k,
      kc: 1 - k,
    };

    const shareDomain = inputShareDomain ?? shouldShareDomain(chartType);
    const domain = shareDomain ? dataKeys : groupsKeys;

    const showLegend = inputShowLegend ?? domain.length > 1;

    const dims = new Dimensions(width, height);

    let titleGetter: Text.Getter | undefined;

    if (title !== undefined) {
      titleGetter = Text.getter({
        svg,
        text: title,
        textType: "title",
        anchor: titleAnchor,
        dims: dims.resolve(),
      });
      const { height } = svg.measureText(title, "title");
      dims.addTop(height);
    }

    let subtitleGetter: Text.Getter | undefined;

    if (subtitle !== undefined) {
      subtitleGetter = Text.getter({
        svg,
        text: subtitle,
        textType: "subtitle",
        anchor: subtitleAnchor,
        dims: dims.resolve(),
      });
      const { height } = svg.measureText(subtitle, "subtitle");
      dims.addTop(height);
    }

    const colorMap = new ColorMap(domain, paletteName);

    let colorLegendsGetters: ColorLegend.Getter[] | undefined;

    if (showLegend) {
      const legendItemHeight = textDims.legendItem.height;
      colorLegendsGetters = ColorLegend.getters({
        colorMap,
        anchor: legendAnchor,
        title: legendTitle,
        itemHeight: legendItemHeight,
        svg,
        dims: dims.resolve(),
      });

      const colorLegendHeight = ColorLegend.getHeight(
        colorLegendsGetters,
        legendItemHeight
      );

      dims.addBottom(colorLegendHeight);

      if (chartType === "bar") {
        dims.addBottom(dims.BASE_MARGIN * 2);
      } else {
        dims.addBottom(dims.BASE_MARGIN);
      }
    } else {
      if (chartType === "bar") {
        dims.addBottom(dims.BASE_MARGIN);
      }
    }

    if (title || subtitle) {
      dims.addTop(dims.BASE_MARGIN);
    }

    dims.addBottom(dims.BASE_MARGIN);

    let verticalAxisGetters: VerticalAxis.Getter | undefined;

    if (chartType === "bar") {
      if (showValues) {
        dims.addTop(dims.BASE_MARGIN);
      }

      const { show = groups.length > 0, title = "" } = step.verticalAxis || {};

      if (show) {
        const width = VerticalAxis.getWidth({
          svg,
          maxValue: maxValue.actual,
        });
        const titleHeight = title
          ? svg.measureText(title, "verticalAxisTitle").height
          : 0;
        const titleMargin = dims.BASE_MARGIN;

        dims.addTop(titleHeight + titleMargin).addLeft(width);

        verticalAxisGetters = VerticalAxis.getters({
          title,
          titleMargin: {
            top: -(
              titleHeight +
              titleMargin +
              (title && showValues ? dims.BASE_MARGIN : 0)
            ),
            right: 0,
            bottom: 0,
            left: -width,
          },
          svg,
          dims: dims.resolve(),
          tickHeight: textDims.tick.height,
          maxValue: maxValue.actual,
          _maxValue: _showVerticalAxis ? _maxValue : undefined,
        });
      }

      _showVerticalAxis = show;
    } else {
      _showVerticalAxis = false;
    }

    const groupsGetters: Group.Getter[] = Group.getters(
      chartType,
      chartSubtype,
      {
        groups,
        groupsKeys,
        dataKeys,
        shareDomain,
        maxValue,
        showValues,
        showDatumLabels,
        svg,
        dims: dims.resolve(),
        textDims,
        colorMap,
        cartoonize,
      }
    );

    steps.push({
      key,
      title: titleGetter,
      subtitle: subtitleGetter,
      colorLegends: colorLegendsGetters,
      verticalAxis: verticalAxisGetters,
      groups: groupsGetters,
    });

    _maxValue = maxValue.actual;
  }

  return steps;
};

export type Int = {
  titles: Text.Int[];
  subtitles: Text.Int[];
  groups: Group.Int[];
  colorLegends: ColorLegend.Int[];
  verticalAxes: VerticalAxis.Int[];
};

export type IntsMap = Map<string, Int>;

export const intsMap = ({
  steps,
  svg,
}: {
  steps: Getter[];
  svg: Svg;
}): IntsMap => {
  const intsMap: IntsMap = new Map();
  let _titleInts: Text.Int[] | undefined;
  let _subtitleInts: Text.Int[] | undefined;
  let _groupInts: Group.Int[] | undefined;
  let _colorLegendInts: ColorLegend.Int[] | undefined;
  let _verticalAxisInts: VerticalAxis.Int[] | undefined;

  steps.forEach((step, i) => {
    const { key, title, subtitle, groups, colorLegends, verticalAxis } = step;
    const _stepGetters: Getter | undefined = steps[i - 1];

    const titlesInts = Text.ints({
      getters: title ? [title] : [],
      _getters: _stepGetters?.title ? [_stepGetters.title] : undefined,
      _ints: _titleInts,
    });

    const subtitlesInts = Text.ints({
      getters: subtitle ? [subtitle] : [],
      _getters: _stepGetters?.subtitle ? [_stepGetters.subtitle] : undefined,
      _ints: _subtitleInts,
    });

    const colorLegendsInts = ColorLegend.ints({
      getters: colorLegends,
      _getters: _stepGetters?.colorLegends,
      _ints: _colorLegendInts,
    });

    const verticalAxesInts = VerticalAxis.ints({
      getters: verticalAxis ? [verticalAxis] : [],
      _getters: _stepGetters?.verticalAxis
        ? [_stepGetters.verticalAxis]
        : undefined,
      _ints: _verticalAxisInts,
    });

    const groupsInts = Group.ints({
      getters: groups,
      _getters: _stepGetters?.groups,
      _ints: _groupInts,
    });

    intsMap.set(key, {
      titles: (_titleInts = titlesInts),
      subtitles: (_subtitleInts = subtitlesInts),
      // Sort the groups so they are rendered in a correct order.
      groups: (_groupInts = groupsInts.sort(stateOrderComparator)),
      colorLegends: (_colorLegendInts = colorLegendsInts),
      verticalAxes: (_verticalAxisInts = verticalAxesInts),
    });
  });

  return intsMap;
};

export type Resolved = {
  titles: Text.Resolved[];
  subtitles: Text.Resolved[];
  groups: Group.Resolved[];
  colors: ColorLegend.Resolved[];
  verticalAxes: VerticalAxis.Resolved[];
};

export const resolve = (ints: Int, t: number) => {
  const { titles, subtitles, groups, colorLegends, verticalAxes } = ints;

  return {
    titles: Text.resolve({ ints: titles, t }),
    subtitles: Text.resolve({ ints: subtitles, t }),
    groups: Group.resolve({ ints: groups, t }),
    colors: ColorLegend.resolve({ ints: colorLegends, t }),
    verticalAxes: VerticalAxis.resolve({ ints: verticalAxes, t }),
  };
};

export const render = ({
  resolved,
  svg,
  tooltip,
  finished,
  indicateProgress,
}: {
  resolved: Resolved;
  svg: Svg;
  tooltip: Tooltip;
  finished: boolean;
  indicateProgress: boolean;
}) => {
  const { titles, subtitles, colors, verticalAxes, groups } = resolved;

  Text.render({
    selection: svg.selection,
    resolved: titles,
    key: "title",
  });

  Text.render({
    selection: svg.selection,
    resolved: subtitles,
    key: "subtitle",
  });

  ColorLegend.render({
    resolved: colors,
    selection: svg.selection,
  });

  VerticalAxis.render({
    resolved: verticalAxes,
    selection: svg.selection,
  });

  Group.render({
    resolved: groups,
    svg,
    tooltip: finished ? tooltip : undefined,
  });

  if (finished) {
    tooltip.node.raise();

    if (indicateProgress) {
      svg.selection.style("border-left", "3px solid transparent");
    }
  } else {
    tooltip.hide();

    if (indicateProgress) {
      svg.selection.style("border-left", "3px solid #e9e9e9");
    }
  }
};
