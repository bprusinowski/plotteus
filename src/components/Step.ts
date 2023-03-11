import { Axis, AxisTick, ColorLegend, Group, Svg, Text, Tooltip } from ".";
import { ColorMap } from "../colors";
import { Dimensions } from "../dims";
import { BarChartSubtype, InputStep, MaxValue } from "../types";
import { getTextDims, max, stateOrderComparator, sum, unique } from "../utils";
import { shouldShareDomain } from "./utils";

export type Getter = {
  key: string;
  title: Text.Getter | undefined;
  subtitle: Text.Getter | undefined;
  groups: Group.Getter[];
  colorLegends: ColorLegend.Getter[] | undefined;
  verticalAxis: Axis.Getter | undefined;
  horizontalAxis: Axis.Getter | undefined;
};

// one-dimensional (value) - bar, bubble, pie, treemap
// two-dimensional (x, y) - scatter
// three-dimensional (x, y, value) - bubble

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
  let _showHorizontalAxis: boolean | undefined;
  let _showVerticalAxis: boolean | undefined;
  let _maxHorizontalAxisValue: number | undefined;
  let _maxVerticalAxisValue: number | undefined;
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

    let chartSubtype: BarChartSubtype | undefined;
    switch (step.chartType) {
      case "bar":
        chartSubtype = step.chartSubtype ?? "grouped";
        break;
    }

    const groupsKeys = groups.map((d) => d.key);
    const dataKeys = unique(groups.flatMap((d) => d.data.map((d) => d.key)));

    let maxDataValue = 0;

    if (chartType === "bar" && chartSubtype === "stacked") {
      // Sum values by group for stacked bar chart.
      groups.forEach((d) => {
        const groupSum = sum(d.data.map((d) => d.value));

        if (groupSum > maxDataValue) {
          maxDataValue = groupSum;
        }
      });
    } else if (chartType !== "scatter") {
      maxDataValue =
        max(groups.flatMap((d) => d.data.map((d) => d.value))) ?? 0;
    } else {
      const xValues = groups.flatMap((d) => d.data.map((d) => d.x));
      const yValues = groups.flatMap((d) => d.data.map((d) => d.y));

      const xMax = max(xValues) ?? 0;
      const yMax = max(yValues) ?? 0;

      maxDataValue = Math.max(xMax, yMax);
    }

    const k = inputMaxValue ? maxDataValue / inputMaxValue : 1;
    const maxValue: MaxValue = {
      data: maxDataValue,
      scale: inputMaxValue,
      actual: inputMaxValue ?? maxDataValue,
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
        type: "title",
        anchor: titleAnchor,
        dims: dims.resolve(),
      });
      Text.updateDims({
        dims,
        svg,
        textType: "title",
        text: title,
      });
    }

    let subtitleGetter: Text.Getter | undefined;
    if (subtitle !== undefined) {
      subtitleGetter = Text.getter({
        svg,
        text: subtitle,
        type: "subtitle",
        anchor: subtitleAnchor,
        dims: dims.resolve(),
      });
      Text.updateDims({
        dims,
        svg,
        textType: "subtitle",
        text: subtitle,
      });
    }

    if (title || subtitle) {
      dims.addTop(dims.BASE_MARGIN);
    }

    const colorMap = new ColorMap(domain, paletteName);

    let colorLegendsGetters: ColorLegend.Getter[] | undefined;
    if (showLegend) {
      colorLegendsGetters = ColorLegend.getters({
        colorMap,
        anchor: legendAnchor,
        title: legendTitle,
        itemHeight: textDims.legendItem.height,
        svg,
        dims: dims.resolve(),
      });
    }

    ColorLegend.updateDims({
      dims,
      getters: colorLegendsGetters,
      itemHeight: textDims.legendItem.height,
      chartType,
    });

    if (chartType === "bar" || chartType === "scatter") {
      const {
        show = chartType === "bar" ? groups.length > 0 : true,
        title = "",
      } = step.verticalAxis || {};

      if (show) {
        const titleHeight = textDims.axisTitle.height;
        Axis.updateDims({
          type: "vertical",
          dims,
          svg,
          titleHeight: title ? titleHeight : 0,
          maxValue: maxValue.actual,
          tickHeight: textDims.axisTick.height,
        });
      }
    }

    let horizontalAxisGetters: Axis.Getter | undefined;
    if (chartType === "scatter") {
      const { show = true, title = "" } = step.horizontalAxis || {};

      if (show) {
        const titleHeight = textDims.axisTitle.height;
        const width = Axis.getWidth({ svg, maxValue: maxValue.actual });
        Axis.updateDims({
          type: "horizontal",
          dims,
          svg,
          maxValue: maxValue.actual,
          titleHeight: title ? titleHeight : 0,
          tickHeight: textDims.axisTick.height,
        });
        const resolvedDims = dims.resolve();

        horizontalAxisGetters = Axis.getters({
          type: "horizontal",
          title,
          titleMargin: {
            top:
              titleHeight +
              dims.BASE_MARGIN +
              AxisTick.SIZE +
              AxisTick.LABEL_MARGIN,
            right:
              resolvedDims.margin.right +
              resolvedDims.margin.left -
              width * 0.5,
            bottom: 0,
            left: 0,
          },
          svg,
          dims: resolvedDims,
          tickHeight: textDims.axisTick.height,
          maxValue: maxValue.actual,
          _maxValue: _showHorizontalAxis ? _maxHorizontalAxisValue : undefined,
        });
      }

      _showHorizontalAxis = show;
    } else {
      _showHorizontalAxis = false;
    }

    let verticalAxisGetters: Axis.Getter | undefined;
    if (chartType === "bar" || chartType === "scatter") {
      if (chartType === "bar" && showValues) {
        dims.addTop(dims.BASE_MARGIN);
      }

      const {
        show = chartType === "bar" ? groups.length > 0 : true,
        title = "",
      } = step.verticalAxis || {};

      if (show) {
        const width = Axis.getWidth({ svg, maxValue: maxValue.actual });
        const titleHeight = textDims.axisTitle.height;

        verticalAxisGetters = Axis.getters({
          type: "vertical",
          title,
          titleMargin: title
            ? {
                top: -(
                  titleHeight +
                  dims.BASE_MARGIN +
                  (chartType === "bar" && showValues
                    ? textDims.datumValue.height
                    : 0)
                ),
                right: 0,
                bottom: 0,
                left: -width - AxisTick.SIZE - AxisTick.LABEL_MARGIN,
              }
            : {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              },
          svg,
          dims: dims.resolve(),
          tickHeight: textDims.axisTick.height,
          maxValue: maxValue.actual,
          _maxValue: _showVerticalAxis ? _maxVerticalAxisValue : undefined,
        });
      }

      _showVerticalAxis = show;
    } else {
      _showVerticalAxis = false;
    }

    const commonGroupGetterProps = {
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
    };
    let groupsGetters: Group.Getter[];
    switch (chartType) {
      case "bar":
        groupsGetters = Group.valueGetters({
          chartType,
          chartSubtype: chartSubtype!,
          props: {
            ...commonGroupGetterProps,
            groups,
          },
        });
        break;
      case "scatter":
        groupsGetters = Group.xyGetters({
          chartType,
          props: {
            ...commonGroupGetterProps,
            groups,
          },
        });
        break;
      default:
        groupsGetters = Group.valueGetters({
          chartType,
          props: {
            ...commonGroupGetterProps,
            groups,
          },
        });
    }

    steps.push({
      key,
      title: titleGetter,
      subtitle: subtitleGetter,
      colorLegends: colorLegendsGetters,
      horizontalAxis: horizontalAxisGetters,
      verticalAxis: verticalAxisGetters,
      groups: groupsGetters,
    });

    // FIXME
    _maxHorizontalAxisValue = 1;
    _maxVerticalAxisValue = maxValue.actual;
  }

  return steps;
};

export type Int = {
  titles: Text.Int[];
  subtitles: Text.Int[];
  groups: Group.Int[];
  colorLegends: ColorLegend.Int[];
  horizontalAxes: Axis.Int[];
  verticalAxes: Axis.Int[];
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
  let _verticalAxisInts: Axis.Int[] | undefined;
  let _horizontalAxisInts: Axis.Int[] | undefined;

  steps.forEach((step, i) => {
    const {
      key,
      title,
      subtitle,
      groups,
      colorLegends,
      horizontalAxis,
      verticalAxis,
    } = step;
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

    const horizontalAxesInts = Axis.ints({
      getters: horizontalAxis ? [horizontalAxis] : [],
      _getters: _stepGetters?.horizontalAxis
        ? [_stepGetters.horizontalAxis]
        : undefined,
      _ints: _horizontalAxisInts,
    });

    const verticalAxesInts = Axis.ints({
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
      horizontalAxes: (_horizontalAxisInts = horizontalAxesInts),
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
  horizontalAxes: Axis.Resolved[];
  verticalAxes: Axis.Resolved[];
};

export const resolve = (ints: Int, t: number) => {
  const {
    titles,
    subtitles,
    groups,
    colorLegends,
    horizontalAxes,
    verticalAxes,
  } = ints;

  return {
    titles: Text.resolve({ ints: titles, t }),
    subtitles: Text.resolve({ ints: subtitles, t }),
    groups: Group.resolve({ ints: groups, t }),
    colors: ColorLegend.resolve({ ints: colorLegends, t }),
    horizontalAxes: Axis.resolve({ ints: horizontalAxes, t }),
    verticalAxes: Axis.resolve({ ints: verticalAxes, t }),
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
  const { titles, subtitles, colors, horizontalAxes, verticalAxes, groups } =
    resolved;

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

  Axis.render({
    resolved: horizontalAxes,
    selection: svg.selection,
    type: "horizontal",
  });

  Axis.render({
    resolved: verticalAxes,
    selection: svg.selection,
    type: "vertical",
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
