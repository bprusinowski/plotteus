import { makeSvg, makeTooltip, Step } from "./components";
import { InputStep, StoryOptions } from "./types";
import { deriveSubtlerColor } from "./utils";

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
  options: StoryOptions = {}
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
  const { svgBackgroundColor = "#FFFFFF" } = options;
  const svg = makeSvg(div, svgBackgroundColor);
  const tooltip = makeTooltip(div);
  const progressBarColor = deriveSubtlerColor(svgBackgroundColor);
  const info = Step.info(steps, svg);

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
      info,
      options: { svgBackgroundColor },
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

  return { render };
};

export { InputStep, makeStory };
