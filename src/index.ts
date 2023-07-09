import { makeSvg, makeTooltip, Step, Svg } from "./components";
import { InputStep, InputStoryOptions, TextTypeDims } from "./types";
import {
  deriveSubtlerColor,
  getDataValues,
  getTextDims,
  getTextTypeDims,
  max,
  TextDims,
  unique,
} from "./utils";

export type Info = {
  textTypeDims: TextTypeDims;
  groupLabelDims: TextDims;
  maxGroupLabelWidth: number;
  datumLabelDims: TextDims;
  datumValueDims: TextDims;
};

export const info = (inputSteps: InputStep[], svg: Svg): Info => {
  const textTypeDims = getTextTypeDims(svg);
  const groups = inputSteps.map((d) => d.groups).flat();
  const groupLabels = unique(groups.map((d) => d.key));
  const groupLabelDims = getTextDims(groupLabels, svg, "groupLabel");
  const datumLabels = unique(groups.flatMap((d) => d.data.map((d) => d.key)));
  const datumLabelDims = getTextDims(datumLabels, svg, "datumLabel");
  const datumValues = unique(inputSteps.flatMap(getDataValues));
  const datumValueDims = getTextDims(datumValues, svg, "datumValue");

  return {
    textTypeDims,
    groupLabelDims,
    maxGroupLabelWidth:
      max(Object.values(groupLabelDims).map((d) => d.width)) ?? 0,
    datumLabelDims,
    datumValueDims,
  };
};

/**
 * Creates a new `Story` object.
 *
 * @param div - `div` element that will be used as Story's container.
 * @param steps - Array of step configs.
 * @param options - Story options.
 *
 * @returns`Story` object.
 */
const makeStory = (
  div: HTMLDivElement,
  steps: InputStep[],
  options?: InputStoryOptions
): {
  /**
   * Renders a given step.
   *
   * @param stepKey - Step key. Refers to one of the steps passed to the `makeStory` function.
   * @param t - Value between 0 and 1, indicating step's progress.
   * @param indicateProgress - Whether to indicate step's progress.
   */
  render: (
    stepKey: string | null | undefined,
    t: number,
    indicateProgress?: boolean
  ) => void;
} => {
  const { svgBackgroundColor = "#FFFFFF" } = options ?? {};
  const svg = makeSvg(div, svgBackgroundColor);
  const tooltip = makeTooltip(div);
  const progressBarColor = deriveSubtlerColor(svgBackgroundColor);
  const storyInfo = info(steps, svg);

  let loaded = false;
  // Previous key.
  let _key: string | null | undefined;
  // Previous progress.
  let _t = 0;

  let intsMap: Step.IntsMap | undefined;

  new ResizeObserver(() => {
    const { width, height } = svg.measure();
    const recompute = () => {
      prepareStepsIntsMap(width, height);
      render();
    };

    if (loaded) {
      recompute();
    } else {
      // Potentially wait for fonts to be loaded before the initial computation.
      setTimeout(() => recompute(), 0);
      loaded = true;
    }
  }).observe(div);

  const prepareStepsIntsMap = (width: number, height: number): void => {
    const getters = Step.getters({
      storyInfo,
      storyOptions: { svgBackgroundColor },
      steps,
      svg,
      width,
      height,
    });
    intsMap = Step.intsMap({ steps: getters, svg });
  };

  const render = (
    stepKey: string | null | undefined = _key,
    t: number = _t,
    indicateProgress = true
  ): void => {
    // Save previous step & progress for the sake of window resizing.
    _key = stepKey;
    _t = t;

    if (intsMap && stepKey !== null && stepKey !== undefined) {
      const ints = intsMap.get(stepKey);

      if (ints) {
        // Interactions with the story (e.g. hovering) are only allowed for the finished state.
        const finished = t === 0 || t === 1;
        const resolved = Step.resolve(ints, t);

        Step.render({
          resolved,
          svg,
          progressBarColor,
          tooltip,
          finished,
          indicateProgress,
        });
      }
    }
  };

  return {
    render,
  };
};

export { InputStep, makeStory };
