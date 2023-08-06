import { Annotation, Axis, AxisTick, ColorLegend, Svg, Text, Tooltip } from ".";
import * as Story from "..";
import * as Chart from "../charts/Chart";
import { ColorMap } from "../colors";
import { Dimensions } from "../dims";
import { InputStep, StoryOptions } from "../types";
import { max, stateOrderComparator } from "../utils";

export type Getter = {
  key: string;
  title: Text.Getter | undefined;
  subtitle: Text.Getter | undefined;
  groups: Chart.Getter[];
  colorLegends: ColorLegend.Getter[] | undefined;
  verticalAxis: Axis.Getter | undefined;
  horizontalAxis: Axis.Getter | undefined;
  annotations: Annotation.Getter[] | undefined;
};

export const getters = ({
  storyInfo,
  storyOptions,
  steps,
  svg,
  width,
  height,
}: {
  storyInfo: Story.Info;
  storyOptions: StoryOptions;
  steps: InputStep[];
  svg: Svg;
  width: number;
  height: number;
}): Getter[] => {
  const { textTypeDims, annotationDims } = storyInfo;
  const { svgBackgroundColor } = storyOptions;
  const getters: Getter[] = [];
  let _minHorizontalAxisValue: number | undefined;
  let _minVerticalAxisValue: number | undefined;
  let _maxHorizontalAxisValue: number | undefined;
  let _maxVerticalAxisValue: number | undefined;
  const colorMap = new ColorMap();

  for (const step of steps) {
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
      annotations,
    } = step;

    const dims = new Dimensions(width, height);
    const xExtent = Chart.xExtent(step);
    const yExtent = Chart.yExtent(step);

    let titleGetter: Text.Getter | undefined;
    if (title !== undefined) {
      const titleDims = svg.measureText(title, "title", {
        paddingLeft: dims.margin.left,
        paddingRight: dims.margin.right,
      });
      titleGetter = Text.getter({
        svg,
        svgBackgroundColor,
        text: title,
        type: "title",
        anchor: titleAnchor,
        dims,
        textDims: titleDims,
      });
      Text.updateDims({
        dims,
        svg,
        textType: "title",
        text: title,
        textDims: titleDims,
      });

      if (subtitle !== undefined) {
        dims.addTop(dims.BASE_MARGIN * 0.2);
      }
    }

    let subtitleGetter: Text.Getter | undefined;
    if (subtitle !== undefined) {
      const subtitleDims = svg.measureText(subtitle, "subtitle", {
        paddingLeft: dims.margin.left,
        paddingRight: dims.margin.right,
      });
      subtitleGetter = Text.getter({
        svg,
        svgBackgroundColor,
        text: subtitle,
        type: "subtitle",
        anchor: subtitleAnchor,
        dims,
        textDims: subtitleDims,
      });
      Text.updateDims({
        dims,
        svg,
        textType: "subtitle",
        text: subtitle,
        textDims: subtitleDims,
      });
    }

    if (title || subtitle) {
      dims.addTop(dims.BASE_MARGIN);
    }

    // Need to take max annotation width into account before calculating chart info,
    // because bar chart determines whether or not to rotate the labels based on the
    // width of the chart.
    let annotationMaxWidth: number | undefined;
    const horizontalAnnotations = annotations?.filter(
      (d) => d.layout === "horizontal"
    );

    if (horizontalAnnotations?.length && yExtent) {
      const maxWidth = max(
        horizontalAnnotations.map((d) => {
          return annotationDims[d.key].width;
        })
      );

      if (maxWidth !== undefined && maxWidth > 0) {
        annotationMaxWidth = maxWidth;
        dims.addRight(annotationMaxWidth + dims.BASE_MARGIN);
      }
    }

    let annotationMaxHeight: number | undefined;
    const verticalAnnotations = annotations?.filter(
      (d) => d.layout === "vertical"
    );

    if (verticalAnnotations?.length && xExtent) {
      const maxHeight = max(
        verticalAnnotations.map((d) => {
          return annotationDims[d.key].height;
        })
      );

      if (maxHeight !== undefined && maxHeight > 0) {
        annotationMaxHeight = maxHeight;
        dims.addTop(annotationMaxHeight + dims.BASE_MARGIN);
      }
    }

    const chartInfo = Chart.info(storyInfo, svgBackgroundColor, step, dims);
    if (annotationMaxWidth !== undefined) {
      dims.addRight(-(annotationMaxWidth + dims.BASE_MARGIN));
    }
    const colorLegendInfo = ColorLegend.info(step, chartInfo, colorMap);
    const verticalAxisInfo = Axis.info("vertical", chartInfo);
    const horizontalAxisInfo = Axis.info("horizontal", chartInfo);

    let colorLegendsGetters: ColorLegend.Getter[] | undefined;
    if (colorLegendInfo.show) {
      colorLegendsGetters = ColorLegend.getters({
        colorMap,
        anchor: legendAnchor,
        title: legendTitle,
        itemHeight: textTypeDims.legendItem.height,
        svg,
        svgBackgroundColor,
        dims,
      });
      ColorLegend.updateDims({
        dims,
        getters: colorLegendsGetters,
        itemHeight: textTypeDims.legendItem.height,
      });
    }

    if (verticalAxisInfo.show) {
      const { title, tickFormat, minValue, maxValue, addTopMargin } =
        verticalAxisInfo;
      const { height: titleHeight } = svg.measureText(title, "axisTitle", {
        paddingLeft: dims.BASE_MARGIN,
        paddingRight: dims.BASE_MARGIN,
      });
      const ticksCount = Axis.getTicksCount(dims.height);
      Axis.updateDims({
        type: "vertical",
        dims,
        svg,
        titleHeight: title ? titleHeight : 0,
        minValue,
        maxValue,
        tickHeight: textTypeDims.axisTick.height,
        ticksCount,
        tickFormat,
        addTopMargin,
      });
    }

    Chart.updateDims(chartInfo, dims, svg);

    let horizontalAxisGetters: Axis.Getter | undefined;
    if (horizontalAxisInfo.show) {
      const { title, tickFormat, minValue, maxValue, addTopMargin } =
        horizontalAxisInfo;
      const { height: titleHeight } = svg.measureText(title, "axisTitle", {
        paddingLeft: dims.BASE_MARGIN,
        paddingRight: dims.BASE_MARGIN,
      });
      const ticksCount = Axis.getTicksCount(dims.width);
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
        tickHeight: textTypeDims.axisTick.height,
        ticksCount,
        tickFormat,
        addTopMargin,
      });

      horizontalAxisGetters = Axis.getters({
        type: "horizontal",
        title,
        titleMargin: {
          top: dims.BASE_MARGIN * 1.5 + AxisTick.SIZE + AxisTick.LABEL_MARGIN,
          right: dims.margin.right + dims.margin.left - width * 0.5,
          bottom: 0,
          left: 0,
        },
        svg,
        svgBackgroundColor,
        dims,
        tickHeight: textTypeDims.axisTick.height,
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

    if (annotationMaxWidth !== undefined) {
      dims.addRight(annotationMaxWidth + dims.BASE_MARGIN);
    }

    let verticalAxisGetters: Axis.Getter | undefined;
    if (verticalAxisInfo.show) {
      const { title, tickFormat, minValue, maxValue, addTopMargin } =
        verticalAxisInfo;
      const ticksCount = Axis.getTicksCount(dims.height);
      const width = Axis.getWidth({
        svg,
        ticksCount,
        tickFormat,
        minValue,
        maxValue,
      });
      const { height: titleHeight } = svg.measureText(title, "axisTitle", {
        paddingLeft: dims.BASE_MARGIN,
        paddingRight: dims.BASE_MARGIN,
      });

      verticalAxisGetters = Axis.getters({
        type: "vertical",
        title,
        titleMargin: title
          ? {
              top: -(
                titleHeight +
                dims.BASE_MARGIN +
                (addTopMargin ? textTypeDims.datumValue.height : 0)
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
        tickHeight: textTypeDims.axisTick.height,
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
      dims,
      textTypeDims,
      colorMap,
      cartoonize,
    });

    if (annotationMaxWidth !== undefined) {
      dims.addRight(-annotationMaxWidth - dims.BASE_MARGIN);
    }

    let annotationsGetters: Annotation.Getter[] | undefined;
    if (annotations) {
      const info = Annotation.info(xExtent, yExtent, dims);
      annotationsGetters = Annotation.getters({
        info,
        annotations,
        annotationDims,
        dims,
        svg,
        svgBackgroundColor,
      });
    }

    getters.push({
      key,
      title: titleGetter,
      subtitle: subtitleGetter,
      colorLegends: colorLegendsGetters,
      horizontalAxis: horizontalAxisGetters,
      verticalAxis: verticalAxisGetters,
      groups: groupsGetters,
      annotations: annotationsGetters,
    });
  }

  return getters;
};

export type Int = {
  titles: Text.Int[];
  subtitles: Text.Int[];
  groups: Chart.Int[];
  colorLegends: ColorLegend.Int[];
  horizontalAxes: Axis.Int[];
  verticalAxes: Axis.Int[];
  annotations: Annotation.Int[];
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
  let _annotationInts: Annotation.Int[] | undefined;

  steps.forEach((step, i) => {
    const {
      key,
      title,
      subtitle,
      groups,
      colorLegends,
      horizontalAxis,
      verticalAxis,
      annotations,
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

    const annotationInts = Annotation.ints({
      getters: annotations,
      _getters: _stepGetters?.annotations,
      _ints: _annotationInts,
    });

    intsMap.set(key, {
      titles: (_titleInts = titlesInts),
      subtitles: (_subtitleInts = subtitlesInts),
      // Sort the groups so they are rendered in a correct order.
      groups: (_groupInts = groupsInts.sort(stateOrderComparator)),
      colorLegends: (_colorLegendInts = colorLegendsInts),
      horizontalAxes: (_horizontalAxisInts = horizontalAxesInts),
      verticalAxes: (_verticalAxisInts = verticalAxesInts),
      annotations: (_annotationInts = annotationInts),
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
  annotations: Annotation.Resolved[];
};

export const resolve = (ints: Int, t: number): Resolved => {
  const {
    titles,
    subtitles,
    groups,
    colorLegends,
    horizontalAxes,
    verticalAxes,
    annotations,
  } = ints;

  return {
    titles: Text.resolve({ ints: titles, t }),
    subtitles: Text.resolve({ ints: subtitles, t }),
    groups: Chart.resolve({ ints: groups, t }),
    colors: ColorLegend.resolve({ ints: colorLegends, t }),
    horizontalAxes: Axis.resolve({ ints: horizontalAxes, t }),
    verticalAxes: Axis.resolve({ ints: verticalAxes, t }),
    annotations: Annotation.resolve({ ints: annotations, t }),
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
  const {
    titles,
    subtitles,
    colors,
    horizontalAxes,
    verticalAxes,
    groups,
    annotations,
  } = resolved;

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

  Annotation.render({
    resolved: annotations,
    selection: svg.selection,
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
