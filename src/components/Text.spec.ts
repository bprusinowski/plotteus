import { describe, expect, test } from "vitest";
import { Text } from ".";
import { setup } from "../../tests/helpers";
import { FONT_SIZE, FONT_WEIGHT } from "../utils";

describe("Text", () => {
  const { svg, dims } = setup();
  const textDims = svg.measureText("Hello, Plotteus!", "title");
  const enterGetter = Text.getter({
    svg,
    text: "Hello, Plotteus!",
    type: "title",
    anchor: "middle",
    dims,
    svgBackgroundColor: "#FFFFFF",
    textDims,
  });
  const enterInts = Text.ints({
    getters: [enterGetter],
    _getters: undefined,
    _ints: undefined,
  });

  describe("enter", () => {
    describe("getter", () => {
      test("key", () => {
        expect(enterGetter.key).toBe("Hello, Plotteus!");
      });

      test("enter", () => {
        const g = enterGetter.g({ s: (enter) => enter });

        expect(g.fontSize).toEqual(FONT_SIZE.title);
      });

      test("update", () => {
        const g = enterGetter.g({ s: (enter, update) => update ?? enter });

        expect(g.fontSize).toEqual(FONT_SIZE.title);
      });

      test("exit", () => {
        const g = enterGetter.g({ s: (enter, _, exit) => exit ?? enter });

        expect(g.fontSize).toEqual(FONT_SIZE.title);
      });
    });

    describe("ints", () => {
      test("general", () => {
        expect(enterInts.length).toEqual(1);
        expect(enterInts[0].key).toEqual("Hello, Plotteus!");
        expect(enterInts[0].state).toEqual("enter");
      });
    });

    describe("resolve", () => {
      test("0", () => {
        const { key, color, ...r } = Text.resolve({ ints: enterInts, t: 0 })[0];
        const { color: gColor, ...g } = enterGetter.g({ s: (enter) => enter });

        expect(r).toEqual(g);
      });

      test("0.5", () => {
        const { key, color, ...r } = Text.resolve({
          ints: enterInts,
          t: 0.5,
        })[0];

        expect(r).toContain({
          fontSize: FONT_SIZE.title,
          fontWeight: FONT_WEIGHT.title,
        });
      });

      test("1", () => {
        const { key, color, ...r } = Text.resolve({ ints: enterInts, t: 1 })[0];
        const { color: gColor, ...g } = enterGetter.g({
          s: (enter, update) => update ?? enter,
        });

        expect(r).toEqual(g);
      });
    });
  });

  const updateGetter = Text.getter({
    svg,
    text: "Hello, Plotteus!",
    type: "datumLabel",
    anchor: "start",
    dims,
    svgBackgroundColor: "white",
    textDims,
  });
  const updateInts = Text.ints({
    getters: [updateGetter],
    _getters: [enterGetter],
    _ints: enterInts,
  });

  describe("update", () => {
    describe("getter", () => {
      test("key", () => {
        expect(updateGetter.key).toBe("Hello, Plotteus!");
      });

      test("enter", () => {
        const g = updateGetter.g({ s: (enter) => enter });

        expect(g.fontSize).toEqual(FONT_SIZE.datumLabel);
      });

      test("update", () => {
        const g = updateGetter.g({ s: (enter, update) => update ?? enter });

        expect(g.fontSize).toEqual(FONT_SIZE.datumLabel);
      });

      test("exit", () => {
        const g = updateGetter.g({ s: (enter, _, exit) => exit ?? enter });

        expect(g.fontSize).toEqual(FONT_SIZE.datumLabel);
      });
    });

    describe("ints", () => {
      test("general", () => {
        expect(updateInts.length).toEqual(1);
        expect(updateInts[0].key).toEqual("Hello, Plotteus!");
        expect(updateInts[0].state).toEqual("update");
      });
    });

    describe("resolve", () => {
      test("0", () => {
        const { key, color, ...r } = Text.resolve({
          ints: updateInts,
          t: 0,
        })[0];
        const { color: gColor, ...g } = enterGetter.g({
          s: (enter, update) => update ?? enter,
        });

        expect(r).toEqual(g);
      });

      test("0.5", () => {
        const { key, color, ...r } = Text.resolve({
          ints: updateInts,
          t: 0.5,
        })[0];

        expect(r).toContain({
          fontSize:
            FONT_SIZE.title - (FONT_SIZE.title - FONT_SIZE.datumLabel) * 0.5,
          fontWeight:
            FONT_WEIGHT.title -
            (FONT_WEIGHT.title - FONT_WEIGHT.datumLabel) * 0.5,
        });
      });

      test("1", () => {
        const { key, color, ...r } = Text.resolve({
          ints: updateInts,
          t: 1,
        })[0];
        const { color: gColor, ...g } = updateGetter.g({
          s: (enter, update) => update ?? enter,
        });

        expect(r).toEqual(g);
      });
    });
  });

  const exitInts = Text.ints({
    getters: undefined,
    _getters: [updateGetter],
    _ints: updateInts,
  });

  describe("exit", () => {
    describe("ints", () => {
      test("general", () => {
        expect(exitInts.length).toEqual(1);
        expect(exitInts[0].key).toEqual("Hello, Plotteus!");
        expect(exitInts[0].state).toEqual("exit");
      });
    });

    describe("resolve", () => {
      test("0", () => {
        const { key, color, ...r } = Text.resolve({ ints: exitInts, t: 0 })[0];
        const { color: gColor, ...g } = updateGetter.g({
          s: (enter, update) => update ?? enter,
        });

        expect(r).toEqual(g);
      });

      test("0.5", () => {
        const { key, color, ...r } = Text.resolve({
          ints: exitInts,
          t: 0.5,
        })[0];

        expect(r).toContain({
          fontSize: FONT_SIZE.datumLabel,
          fontWeight: FONT_WEIGHT.datumLabel,
        });
      });

      test("1", () => {
        const { key, color, ...r } = Text.resolve({ ints: exitInts, t: 1 })[0];
        const { color: gColor, ...g } = updateGetter.g({
          s: (enter, _, exit) => exit ?? enter,
        });

        expect(r).toEqual(g);
      });
    });
  });
});
