import { getBaseMax } from "./charts/utils";
import {
  BarInputStep,
  InputStep,
  MaxValue,
  MaxXY,
  ScatterInputStep,
} from "./types";
import { max, sum } from "./utils";

type ChartMeta = {
  showsDatumValuesOnTop: boolean;
};

type AxisMeta = {
  show: boolean;
  title: string;
  tickFormat: (d: number) => string;
  maxValue: number;
};

const defaultTickFormat = (d: number) => d.toString();

export class StepMeta {
  public chart: ChartMeta;
  public horizontalAxis?: AxisMeta;
  public verticalAxis?: AxisMeta;

  constructor(step: InputStep) {
    this.chart = this.getChartMeta(step);
    this.horizontalAxis = this.getHorizontalAxis(step);
    this.verticalAxis = this.getVerticalAxis(step);
  }

  private getChartMeta(step: InputStep): ChartMeta {
    switch (step.chartType) {
      case "bar":
        return {
          showsDatumValuesOnTop: true,
        };
      case "scatter":
        return {
          showsDatumValuesOnTop: false,
        };
      case "treemap":
        return {
          showsDatumValuesOnTop: true,
        };
      default:
        return {
          showsDatumValuesOnTop: false,
        };
    }
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

  private getHorizontalAxis(step: InputStep): AxisMeta | undefined {
    switch (step.chartType) {
      case "bar":
        if (step.layout === "horizontal") {
          return {
            show: step.horizontalAxis?.show ?? step.groups.length > 0,
            title: step.horizontalAxis?.title ?? "",
            tickFormat: step.horizontalAxis?.tickFormat ?? defaultTickFormat,
            maxValue: this.getMaxValueBar(step).value.actual,
          };
        }

        break;
      case "scatter":
        return {
          show: step.horizontalAxis?.show ?? true,
          title: step.horizontalAxis?.title ?? "",
          tickFormat: step.horizontalAxis?.tickFormat ?? defaultTickFormat,
          maxValue: this.getMaxXY(step).x.actual,
        };
    }
  }

  private getVerticalAxis(step: InputStep): AxisMeta | undefined {
    switch (step.chartType) {
      case "bar":
        if (step.layout === "vertical" || step.layout === undefined) {
          return {
            show: step.verticalAxis?.show ?? step.groups.length > 0,
            title: step.verticalAxis?.title ?? "",
            tickFormat: step.verticalAxis?.tickFormat ?? defaultTickFormat,
            maxValue: this.getMaxValueBar(step).value.actual,
          };
        }

        break;
      case "scatter":
        return {
          show: step.verticalAxis?.show ?? true,
          title: step.verticalAxis?.title ?? "",
          tickFormat: step.verticalAxis?.tickFormat ?? defaultTickFormat,
          maxValue: this.getMaxXY(step).y.actual,
        };
    }
  }
}
