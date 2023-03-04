import { PaletteName } from "./colors";

// External.
type BaseInputStep = {
  key: string;

  /** Labels. */
  title?: string;
  titleAnchor?: Anchor;
  subtitle?: string;
  subtitleAnchor?: Anchor;

  /** Legend. */
  shareDomain?: boolean;
  showLegend?: boolean;
  legendAnchor?: Anchor;

  /** Values & data labels. */
  showValues?: boolean;
  maxValue?: number;
  showDatumLabels?: boolean;

  /** Appearance. */
  palette?: PaletteName;
  cartoonize?: boolean;

  /** Data. */
  groups: InputGroup[];
};

export type InputStep = BaseInputStep &
  (
    | {
        chartType: "bar";
        chartSubtype?: BarChartSubtype;
        verticalAxis?: {
          show?: boolean;
          title?: string;
        };
      }
    | {
        chartType: Exclude<ChartType, "bar">;
      }
  );

export type InputGroup = {
  key: string;
  opacity?: number;
  data: InputDatum[];
};

export type InputDatum = {
  key: string;
  value: number;
  // Used to teleport datum between groups. Formatted as "groupKey:datumKey".
  teleportFrom?: string;
  fill?: string;
  opacity?: number;
};

export type Anchor = "start" | "middle" | "end";

// Charts.
export type ChartType = "bar" | "bubble" | "pie" | "treemap";

export type BarChartSubtype = "grouped" | "stacked";

export type TextType =
  | "title"
  | "subtitle"
  | "legendItem"
  | "verticalAxisTitle"
  | "groupLabel"
  | "datumLabel"
  | "datumValue"
  | "tick";

export type TextDims = {
  [type in TextType]: {
    height: number;
    yShift: number;
  };
};

export type MaxValue = {
  data: number;
  scale: number | undefined;
  actual: number;
  // scale / data if defined
  k: number;
  // complement of k, 1 - k
  kc: number;
};

// Getters.
export type GProps<T> = {
  s: <Z>(enter: Z, update?: Z | null, exit?: Z | null) => Z;
  _g?: T;
};

// Interpolators.
export type State = "enter" | "update" | "exit";

export type GenericInt<T> = (t: number) => T;
