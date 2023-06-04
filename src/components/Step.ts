import { Axis, AxisTick, ColorLegend, Svg, Text, Tooltip } from ".";
import {
  BarChart,
  BubbleChart,
  PieChart,
  ScatterChart,
  TreemapChart,
} from "../charts";
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
    const chartInfo = Chart.info(step);
    const colorLegendInfo = ColorLegend.info(step, chartInfo, colorMap);
    const verticalAxisInfo = Axis.info("vertical", chartInfo);
    const horizontalAxisInfo = Axis.info("horizontal", chartInfo);

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

    let colorLegendsGetters: ColorLegend.Getter[] | undefined;
    if (colorLegendInfo.show) {
      colorLegendsGetters = ColorLegend.getters({
        colorMap,
        anchor: legendAnchor,
        title: legendTitle,
        itemHeight: textDims.legendItem.height,
        svg,
        dims: dims.resolve(),
      });
      ColorLegend.updateDims({
        dims,
        getters: colorLegendsGetters,
        itemHeight: textDims.legendItem.height,
      });
    }

    if (verticalAxisInfo.show) {
      const { title, tickFormat, maxValue } = verticalAxisInfo;
      const titleHeight = textDims.axisTitle.height;
      const ticksCount = Axis.getTicksCount(dims.resolve().height);
      Axis.updateDims({
        type: "vertical",
        dims,
        svg,
        titleHeight: title ? titleHeight : 0,
        maxValue,
        tickHeight: textDims.axisTick.height,
        ticksCount,
        tickFormat,
      });
    }

    switch (step.chartType) {
      case "bar": {
        const info = BarChart.info(step);
        BarChart.updateDims(info, dims, svg);
        break;
      }
      case "bubble": {
        BubbleChart.updateDims(dims);
        break;
      }
      case "pie": {
        PieChart.updateDims(dims);
        break;
      }
      case "scatter": {
        ScatterChart.updateDims(dims);
        break;
      }
      case "treemap": {
        TreemapChart.updateDims(dims);
        break;
      }
    }

    let horizontalAxisGetters: Axis.Getter | undefined;
    if (horizontalAxisInfo.show) {
      const { title, tickFormat, maxValue } = horizontalAxisInfo;

      const titleHeight = textDims.axisTitle.height;
      const ticksCount = Axis.getTicksCount(dims.resolve().width);
      const width = Axis.getWidth({
        svg,
        ticksCount,
        tickFormat,
        maxValue,
      });
      Axis.updateDims({
        type: "horizontal",
        dims,
        svg,
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
        dims: resolvedDims,
        tickHeight: textDims.axisTick.height,
        ticksCount,
        tickFormat,
        maxValue,
        _maxValue: _maxHorizontalAxisValue,
      });

      _maxHorizontalAxisValue = maxValue;
    } else {
      _maxHorizontalAxisValue = undefined;
    }

    let verticalAxisGetters: Axis.Getter | undefined;
    if (verticalAxisInfo.show) {
      const { title, tickFormat, maxValue, addTopMargin } = verticalAxisInfo;
      const ticksCount = Axis.getTicksCount(dims.resolve().height);
      const width = Axis.getWidth({
        svg,
        ticksCount,
        tickFormat,
        maxValue,
      });
      const titleHeight = textDims.axisTitle.height;

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
        dims: dims.resolve(),
        maxValue,
        _maxValue: _maxVerticalAxisValue,
        ticksCount,
        tickHeight: textDims.axisTick.height,
        tickFormat,
      });

      _maxVerticalAxisValue = maxValue;
    } else {
      _maxVerticalAxisValue = undefined;
    }

    let groupsGetters: Chart.Getter[] = [];
    const chartGetterProps = {
      showDatumLabels,
      svg,
      dims: dims.resolve(),
      textDims,
      colorMap,
      cartoonize,
    };

    switch (step.chartType) {
      case "bar": {
        const info = BarChart.info(step);
        groupsGetters = BarChart.getters(info, chartGetterProps);
        break;
      }
      case "bubble": {
        const info = BubbleChart.info(step);
        groupsGetters = BubbleChart.getters(info, chartGetterProps);
        break;
      }
      case "pie": {
        const info = PieChart.info(step);
        groupsGetters = PieChart.getters(info, chartGetterProps);
        break;
      }
      case "scatter": {
        const info = ScatterChart.info(step);
        groupsGetters = ScatterChart.getters(info, chartGetterProps);
        break;
      }
      case "treemap": {
        const info = TreemapChart.info(step);
        groupsGetters = TreemapChart.getters(info, chartGetterProps);
        break;
      }
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
      svg.selection.style("border-left", "3px solid #e9e9e9");
    }
  }
};
