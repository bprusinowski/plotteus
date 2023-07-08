import { Axis, AxisTick, ColorLegend, Svg, Text, Tooltip } from ".";
import * as Chart from "../charts/Chart";
import { ColorMap } from "../colors";
import { Dimensions } from "../dims";
import { InputStep } from "../types";
import { getTextDims, stateOrderComparator } from "../utils";

export type Getter = {
  key: string;
  title: Text.Getter | undefined;
  subtitle: Text.Getter | undefined;
  groups: Chart.Getter[];
  colorLegends: ColorLegend.Getter[] | undefined;
  verticalAxis: Axis.Getter | undefined;
  horizontalAxis: Axis.Getter | undefined;
};

export const getters = ({
  options,
  steps: inputSteps,
  svg,
  width,
  height,
}: {
  options: { svgBackgroundColor: string };
  steps: InputStep[];
  svg: Svg;
  width: number;
  height: number;
}): Getter[] => {
  const { svgBackgroundColor } = options;
  const steps: Getter[] = [];
  let _minHorizontalAxisValue: number | undefined;
  let _minVerticalAxisValue: number | undefined;
  let _maxHorizontalAxisValue: number | undefined;
  let _maxVerticalAxisValue: number | undefined;
  const textDims = getTextDims(svg);
  const colorMap = new ColorMap();

  for (const step of inputSteps) {
    const {
      key,
      title,
      titleAnchor = "start",
      subtitle,
      subtitleAnchor = "start",
      legendTitle = "",
      legendAnchor = "middle",
      showDatumLabels = false,
      cartoonize = false,
    } = step;

    const dims = new Dimensions(width, height);
    const chartInfo = Chart.info(svgBackgroundColor, step);
    const colorLegendInfo = ColorLegend.info(step, chartInfo, colorMap);
    const verticalAxisInfo = Axis.info("vertical", chartInfo);
    const horizontalAxisInfo = Axis.info("horizontal", chartInfo);

    let titleGetter: Text.Getter | undefined;
    if (title !== undefined) {
      titleGetter = Text.getter({
        svg,
        svgBackgroundColor,
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
        svgBackgroundColor,
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

    let colorLegendsGetters: ColorLegend.Getter[] | undefined;
    if (colorLegendInfo.show) {
      colorLegendsGetters = ColorLegend.getters({
        colorMap,
        anchor: legendAnchor,
        title: legendTitle,
        itemHeight: textDims.legendItem.height,
        svg,
        svgBackgroundColor,
        dims: dims.resolve(),
      });
      ColorLegend.updateDims({
        dims,
        getters: colorLegendsGetters,
        itemHeight: textDims.legendItem.height,
      });
    }

    if (verticalAxisInfo.show) {
      const { title, tickFormat, minValue, maxValue } = verticalAxisInfo;
      const titleHeight = textDims.axisTitle.height;
      const ticksCount = Axis.getTicksCount(dims.resolve().height);
      Axis.updateDims({
        type: "vertical",
        dims,
        svg,
        titleHeight: title ? titleHeight : 0,
        minValue,
        maxValue,
        tickHeight: textDims.axisTick.height,
        ticksCount,
        tickFormat,
      });
    }

    Chart.updateDims(chartInfo, dims, svg);

    let horizontalAxisGetters: Axis.Getter | undefined;
    if (horizontalAxisInfo.show) {
      const { title, tickFormat, minValue, maxValue } = horizontalAxisInfo;

      const titleHeight = svg.measureText(title, "axisTitle").height;
      const ticksCount = Axis.getTicksCount(dims.resolve().width);
      const width = Axis.getWidth({
        svg,
        ticksCount,
        tickFormat,
        minValue,
        maxValue,
      });
      Axis.updateDims({
        type: "horizontal",
        dims,
        svg,
        minValue,
        maxValue,
        titleHeight: title ? titleHeight : 0,
        tickHeight: textDims.axisTick.height,
        ticksCount,
        tickFormat,
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
            resolvedDims.margin.right + resolvedDims.margin.left - width * 0.5,
          bottom: 0,
          left: 0,
        },
        svg,
        svgBackgroundColor,
        dims,
        tickHeight: textDims.axisTick.height,
        ticksCount,
        tickFormat,
        minValue,
        _minValue: _minHorizontalAxisValue,
        maxValue,
        _maxValue: _maxHorizontalAxisValue,
      });

      _minHorizontalAxisValue = minValue;
      _maxHorizontalAxisValue = maxValue;
    } else {
      _minHorizontalAxisValue = undefined;
      _maxHorizontalAxisValue = undefined;
    }

    let verticalAxisGetters: Axis.Getter | undefined;
    if (verticalAxisInfo.show) {
      const { title, tickFormat, minValue, maxValue, addTopMargin } =
        verticalAxisInfo;
      const ticksCount = Axis.getTicksCount(dims.resolve().height);
      const width = Axis.getWidth({
        svg,
        ticksCount,
        tickFormat,
        minValue,
        maxValue,
      });
      const titleHeight = svg.measureText(title, "axisTitle").height;

      verticalAxisGetters = Axis.getters({
        type: "vertical",
        title,
        titleMargin: title
          ? {
              top: -(
                titleHeight +
                dims.BASE_MARGIN +
                (addTopMargin ? textDims.datumValue.height : 0)
              ),
              right: 0,
              bottom: 0,
              left: -(width + AxisTick.SIZE + AxisTick.LABEL_MARGIN),
            }
          : {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
        svg,
        svgBackgroundColor,
        dims,
        minValue,
        _minValue: _minVerticalAxisValue,
        maxValue,
        _maxValue: _maxVerticalAxisValue,
        ticksCount,
        tickHeight: textDims.axisTick.height,
        tickFormat,
      });

      _minVerticalAxisValue = minValue;
      _maxVerticalAxisValue = maxValue;
    } else {
      _minVerticalAxisValue = undefined;
      _maxVerticalAxisValue = undefined;
    }

    const groupsGetters = Chart.getters(chartInfo, {
      showDatumLabels,
      svg,
      dims: dims.resolve(),
      textDims,
      colorMap,
      cartoonize,
    });

    steps.push({
      key,
      title: titleGetter,
      subtitle: subtitleGetter,
      colorLegends: colorLegendsGetters,
      horizontalAxis: horizontalAxisGetters,
      verticalAxis: verticalAxisGetters,
      groups: groupsGetters,
    });
  }

  return steps;
};

export type Int = {
  titles: Text.Int[];
  subtitles: Text.Int[];
  groups: Chart.Int[];
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
  let _groupInts: Chart.Int[] | undefined;
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

    const groupsInts = Chart.ints({
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
  groups: Chart.Resolved[];
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
    groups: Chart.resolve({ ints: groups, t }),
    colors: ColorLegend.resolve({ ints: colorLegends, t }),
    horizontalAxes: Axis.resolve({ ints: horizontalAxes, t }),
    verticalAxes: Axis.resolve({ ints: verticalAxes, t }),
  };
};

export const render = ({
  resolved,
  svg,
  progressBarColor,
  tooltip,
  finished,
  indicateProgress,
}: {
  resolved: Resolved;
  svg: Svg;
  progressBarColor: string;
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

  Chart.render({
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
      svg.selection.style("border-left", `3px solid ${progressBarColor}`);
    }
  }
};
