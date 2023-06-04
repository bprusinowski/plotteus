import { getScatterGetters } from "../charts/scatter";
import { ColorMap } from "../colors";
import { ResolvedDimensions } from "../dims";
import { BaseMax, InputGroupValue, InputGroupXY, TextDims } from "../types";
import * as Datum from "./Datum";
import * as Generic from "./Generic";
import { Svg } from "./Svg";

type G = {
  d: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelFontSize: number;
  labelStrokeWidth: number;
  opacity: number;
};

export type Getter = Generic.Getter<G, { data: Datum.Getter[] }>;

export type BaseGetterProps = {
  // Data.
  groupsKeys: string[];
  dataKeys: string[];
  // Scales.
  shareDomain: boolean;
  // Labels.
  showValues: boolean;
  showDatumLabels: boolean;
  // Dimensions.
  svg: Svg;
  dims: ResolvedDimensions;
  textDims: TextDims;
  // Appearance.
  colorMap: ColorMap;
  cartoonize: boolean;
};

export type ValueGetterProps = BaseGetterProps & {
  groups: InputGroupValue[];
  maxValue: BaseMax;
};

export type XYGetterProps = BaseGetterProps & {
  groups: InputGroupXY[];
  xMaxValue: BaseMax;
  yMaxValue: BaseMax;
};

type XYGettersProps = {
  chartType: "scatter";
  props: XYGetterProps;
};

export const xyGetters = ({ props }: XYGettersProps): Getter[] => {
  return getScatterGetters(props);
};

export type Resolved = Generic.Resolved<G, { data: Datum.Resolved[] }>;
