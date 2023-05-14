import {
  BarInputStep,
  BaseMax,
  ChartSubtype,
  ChartType,
  DefaultInputStep,
  InputGroupValue,
  InputGroupXY,
  InputStep,
  MaxValue,
  MaxXY,
  ScatterInputStep,
} from "./types";
import { max, sum, unique } from "./utils";

type ChartMeta = {
  groupsKeys: string[];
  dataKeys: string[];
  shareDomain: boolean;
  showsGroupLabelsOnBottom: boolean;
  showsDatumValuesOnTop: boolean;
} & (
  | {
      groups: InputGroupValue[];
      groupsType: "value";
      type: Exclude<ChartType, "scatter">;
      subtype: ChartSubtype | undefined;
      max: MaxValue;
    }
  | {
      groups: InputGroupXY[];
      groupsType: "xy";
      type: "scatter";
      subtype: undefined;
      max: MaxXY;
    }
);

type LegendMeta = {
  domain: string[];
  show: boolean;
};

type AxisMeta = {
  show: boolean;
  title: string;
  tickFormat: (d: number) => string;
};

const defaultTickFormat = (d: number) => d.toString();

export class StepMeta {
  public chart: ChartMeta;
  public legend: LegendMeta;
  public horizontalAxis?: AxisMeta;
  public verticalAxis?: AxisMeta;

  constructor(step: InputStep) {
    this.chart = this.getChartMeta(step);
    this.legend = this.getLegendMeta(step);
    this.horizontalAxis = this.getHorizontalAxis(step);
    this.verticalAxis = this.getVerticalAxis(step);
  }

  private getChartMeta(step: InputStep): ChartMeta {
    const common = {
      shareDomain: step.shareDomain ?? shouldShareDomain(step.chartType),
      groupsKeys: this.getGroupsKeys(step),
      dataKeys: this.getDataKeys(step),
    };

    switch (step.chartType) {
      case "bar":
        return {
          showsGroupLabelsOnBottom: true,
          showsDatumValuesOnTop: true,
          groups: step.groups,
          groupsType: "value",
          type: "bar",
          subtype: step.chartSubtype,
          max: this.getMaxValueBar(step),
          ...common,
        };
      case "scatter":
        return {
          showsGroupLabelsOnBottom: false,
          showsDatumValuesOnTop: false,
          groups: step.groups,
          groupsType: "xy",
          type: "scatter",
          subtype: undefined,
          max: this.getMaxXY(step),
          ...common,
        };
      default:
        return {
          showsGroupLabelsOnBottom: false,
          showsDatumValuesOnTop: false,
          groups: step.groups,
          groupsType: "value",
          type: step.chartType,
          subtype: undefined,
          max: this.getMaxValueDefault(step),
          ...common,
        };
    }
  }

  private getLegendMeta(step: InputStep): LegendMeta {
    const { chart } = this;
    const domain = chart.shareDomain ? chart.dataKeys : chart.groupsKeys;
    const show = step.showLegend ?? domain.length > 1;

    return {
      domain,
      show,
    };
  }

  private getMaxValueBar(step: BarInputStep): MaxValue {
    let valueMax = 0;

    switch (step.chartSubtype) {
      case "stacked":
        // Sum values by group for stacked bar chart.
        step.groups.forEach((d) => {
          const groupSum = sum(d.data.map((d) => d.value));

          if (groupSum > valueMax) {
            valueMax = groupSum;
          }
        });
        break;
      default:
        const values = step.groups.flatMap((d) => d.data.map((d) => d.value));
        valueMax = max(values) ?? 0;
        break;
    }

    return {
      type: "value",
      value: getBaseMax(step.valueScale?.maxValue, valueMax),
    };
  }

  private getMaxValueDefault(step: DefaultInputStep): MaxValue {
    const values = step.groups.flatMap((d) => d.data.map((d) => d.value));
    const valueMax = max(values) ?? 0;

    return {
      type: "value",
      value: getBaseMax(step.valueScale?.maxValue, valueMax),
    };
  }

  private getMaxXY(step: ScatterInputStep): MaxXY {
    const xValues = step.groups.flatMap((d) => d.data.map((d) => d.x));
    const xMax = max(xValues) ?? 0;
    const yValues = step.groups.flatMap((d) => d.data.map((d) => d.y));
    const yMax = max(yValues) ?? 0;

    return {
      type: "xy",
      x: getBaseMax(step.xScale?.maxValue, xMax),
      y: getBaseMax(step.yScale?.maxValue, yMax),
    };
  }

  private getGroupsKeys(step: InputStep): string[] {
    return step.groups.map((d) => d.key);
  }

  private getDataKeys(step: InputStep): string[] {
    return unique(step.groups.flatMap((d) => d.data.map((d) => d.key)));
  }

  private getHorizontalAxis(step: InputStep): AxisMeta | undefined {
    switch (step.chartType) {
      case "scatter":
        return {
          show: step.horizontalAxis?.show ?? true,
          title: step.horizontalAxis?.title ?? "",
          tickFormat: step.horizontalAxis?.tickFormat ?? defaultTickFormat,
        };
    }
  }

  private getVerticalAxis(step: InputStep): AxisMeta | undefined {
    switch (step.chartType) {
      case "bar":
        return {
          show: step.verticalAxis?.show ?? step.groups.length > 0,
          title: step.verticalAxis?.title ?? "",
          tickFormat: step.verticalAxis?.tickFormat ?? defaultTickFormat,
        };
      case "scatter":
        return {
          show: step.verticalAxis?.show ?? true,
          title: step.verticalAxis?.title ?? "",
          tickFormat: step.verticalAxis?.tickFormat ?? defaultTickFormat,
        };
    }
  }
}

const shouldShareDomain = (type: ChartType): boolean => {
  switch (type) {
    case "bar":
    case "pie":
      return true;
    case "bubble":
    case "scatter":
    case "treemap":
      return false;
  }
};

const getBaseMax = (inputMax: number | undefined, dataMax: number): BaseMax => {
  const k = inputMax ? dataMax / inputMax : 1;

  return {
    data: dataMax,
    scale: inputMax,
    actual: inputMax ?? dataMax,
    k,
    kc: 1 - k,
  };
};
