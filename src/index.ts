import {
  Step,
  Svg,
  createFontLoadObserver,
  createResizeObserver,
  createSvg,
  makeTooltip,
  prepareDiv,
} from "./components";
import {
  InputStep,
  InputStoryOptions,
  StoryOptions,
  TextTypeDims,
} from "./types";
import {
  TextDims,
  deriveSubtlerColor,
  getDataValues,
  getTextTypeDims,
  getTextsDims,
  max,
  unique,
} from "./utils";

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
  inputDiv: HTMLDivElement,
  inputSteps: InputStep[],
  inputOptions?: InputStoryOptions
): {
  /**
   * Renders a given step.
   *
   * @param stepKey - Key of the step to render.
   * @param t - Value between 0 and 1, indicating step's progress.
   * @param indicateProgress - Whether to indicate step's progress.
   */
  render: (
    stepKey: string | null | undefined,
    t: number,
    indicateProgress?: boolean
  ) => void;
  /**
   * Destroys the Story. Handy when you want to create a new Story in the same container,
   * as it removes all the elements created by the previous Story along with all event listeners.
   */
  destroy: () => void;
} => {
  const { svgBackgroundColor = "#FFFFFF" } = inputOptions ?? {};
  const storyOptions: StoryOptions = {
    svgBackgroundColor,
  };
  const div = prepareDiv(inputDiv);
  const svg = createSvg(div, storyOptions);
  const tooltip = makeTooltip();
  const progressBarColor = deriveSubtlerColor(svgBackgroundColor);
  let storyInfo = info(inputSteps, svg);

  let _key: string | null | undefined;
  let _t = 0;
  let _width = 0;
  let _height = 0;

  let intsMap: Step.IntsMap | undefined;

  window.onload = () => {
    requestAnimationFrame(() => {
      const { width, height } = svg.measure();
      _width = width;
      _height = height;
      prepareAndRender();
    });
  };

  const fontLoadObserver = createFontLoadObserver(div, () => {
    storyInfo = info(inputSteps, svg);
    prepareAndRender();
  });

  const resizeObserver = createResizeObserver(div, () => {
    const { width, height } = svg.measure();

    if (width !== _width || height !== _height) {
      _width = width;
      _height = height;
      prepareAndRender();
    }
  });

  const prepareAndRender = (): void => {
    prepareStepsIntsMap(_width, _height);
    render();
  };

  const prepareStepsIntsMap = (width: number, height: number): void => {
    const getters = Step.getters({
      storyInfo,
      storyOptions,
      steps: inputSteps,
      svg,
      width,
      height,
    });
    intsMap = Step.intsMap({ steps: getters });
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

  const destroy = (): void => {
    resizeObserver.destroy();
    fontLoadObserver.destroy();
  };

  return {
    render,
    destroy,
  };
};

export type Info = {
  textTypeDims: TextTypeDims;
  groupLabelDims: TextDims;
  maxGroupLabelWidth: number;
  datumLabelDims: TextDims;
  datumValueDims: TextDims;
  annotationDims: TextDims;
};

export const info = (inputSteps: InputStep[], svg: Svg): Info => {
  const textTypeDims = getTextTypeDims(svg);
  const groups = inputSteps.map((inputStep) => inputStep.groups).flat();
  const groupLabels = unique(groups.map((group) => group.key));
  const groupLabelDims = getTextsDims(groupLabels, svg, "groupLabel");
  const maxGroupLabelWidth =
    max(Object.values(groupLabelDims).map((dims) => dims.width)) ?? 0;
  const datumLabels = unique(
    groups.flatMap((group) => group.data.map((d) => d.key))
  );
  const datumLabelDims = getTextsDims(datumLabels, svg, "datumLabel");
  const datumValues = unique(inputSteps.flatMap(getDataValues));
  const datumValueDims = getTextsDims(datumValues, svg, "datumValue");
  const annotationDims: TextDims = Object.fromEntries(
    inputSteps.flatMap((inputStep) =>
      (inputStep.annotations ?? []).map(({ key, text, maxWidth }) => [
        key,
        svg.measureText(text ?? "", "annotationLabel", {
          maxWidth: maxWidth ?? 100,
          paddingLeft: 4,
          paddingTop: 2,
          paddingRight: 4,
          paddingBottom: 2,
        }),
      ])
    )
  );

  return {
    textTypeDims,
    groupLabelDims,
    maxGroupLabelWidth,
    datumLabelDims,
    datumValueDims,
    annotationDims,
  };
};

export { InputStep, makeStory };
