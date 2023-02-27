import { path } from "d3-path";

const TWO_PI = 2 * Math.PI;

type Point = {
  x: number;
  y: number;
};

type BezierPoint = {
  c1: Point;
  c2: Point;
  e: Point;
};

type PathProps = {
  cartoonize: boolean;
} & (
  | {
      type: "bar";
      width: number;
      height: number;
    }
  | {
      type: "bubble";
      r: number;
    }
  | {
      type: "pie";
      startAngle: number;
      endAngle: number;
      r: number;
    }
);

const getRectangleCoords = ({
  width,
  height,
  cartoonize,
}: {
  width: number;
  height: number;
  cartoonize: boolean;
}): BezierPoint[] => {
  const [x0, x1] = [-width / 2, width / 2];
  const [y0, y1] = [-height / 2, height / 2];
  const k = cartoonize ? 2 : 0;

  const startEnd: BezierPoint = {
    c1: {
      x: x0 - k,
      y: y0 + k,
    },
    c2: {
      x: x0 + k,
      y: y0 - k,
    },
    e: {
      x: x0,
      y: y0,
    },
  };

  return [
    startEnd,
    {
      c1: {
        x: x1 - k,
        y: y0 - k,
      },
      c2: {
        x: x1 + k,
        y: y0 + k,
      },
      e: {
        x: x1,
        y: y0,
      },
    },
    {
      c1: {
        x: x1 + k,
        y: y1 - k,
      },
      c2: {
        x: x1 - k,
        y: y1 + k,
      },
      e: {
        x: x1,
        y: y1,
      },
    },
    {
      c1: {
        x: x0 + k,
        y: y1 + k,
      },
      c2: {
        x: x0 - k,
        y: y1 - k,
      },
      e: {
        x: x0,
        y: y1,
      },
    },
    startEnd,
  ];
};

const getCircleCoords = ({
  r,
  cartoonize,
}: {
  r: number;
  cartoonize: boolean;
}): BezierPoint[] => {
  const c = cartoonize ? 0.4 : 0.551915024494;
  const cr = c * r;
  const coords: BezierPoint[] = [
    {
      c1: {
        x: 0,
        y: 0,
      },
      c2: {
        x: 0,
        y: 0,
      },
      e: {
        x: -r,
        y: 0,
      },
    },
    {
      c1: {
        x: -r,
        y: -cr,
      },
      c2: {
        x: -cr,
        y: -r,
      },
      e: {
        x: 0,
        y: -r,
      },
    },
    {
      c1: {
        x: cr,
        y: -r,
      },
      c2: {
        x: r,
        y: -cr,
      },
      e: {
        x: r,
        y: 0,
      },
    },
    {
      c1: {
        x: r,
        y: cr,
      },
      c2: {
        x: cr,
        y: r,
      },
      e: {
        x: 0,
        y: r,
      },
    },
    {
      c1: {
        x: -cr,
        y: r,
      },
      c2: {
        x: -r,
        y: cr,
      },
      e: {
        x: -r,
        y: 0,
      },
    },
  ];

  // Rotate coords, to get a nice shape tweening
  // when rectangle is a preceding shape.
  const rotateByRadians = 45 * (Math.PI / 180);

  return coords.map((d) => {
    const { c1, c2, e } = d;
    const sin = Math.sin(rotateByRadians);
    const cos = Math.cos(rotateByRadians);

    return {
      c1: {
        x: c1.x * cos - c1.y * sin,
        y: c1.y * cos + c1.x * sin,
      },
      c2: {
        x: c2.x * cos - c2.y * sin,
        y: c2.y * cos + c2.x * sin,
      },
      e: {
        x: e.x * cos - e.y * sin,
        y: e.y * cos + e.x * sin,
      },
    };
  });
};

const getPieCoords = ({
  startAngle,
  endAngle,
  r,
  cartoonize,
}: {
  startAngle: number;
  endAngle: number;
  r: number;
  cartoonize: boolean;
}): BezierPoint[] => {
  const k = cartoonize ? 8 : 0;
  const cx = 0;
  const cy = 0;
  const angleExtent = endAngle - startAngle;
  startAngle = startAngle - angleExtent * 0.5;
  endAngle = endAngle - angleExtent * 0.5;

  const getBezierCoords = (
    startAngle: number,
    stopAngle: number
  ): BezierPoint => {
    while (startAngle < 0) {
      startAngle = startAngle + TWO_PI;
    }

    while (stopAngle < 0) {
      stopAngle = stopAngle + TWO_PI;
    }

    startAngle = startAngle % TWO_PI;
    stopAngle = stopAngle % TWO_PI;

    if (startAngle > stopAngle) {
      stopAngle = stopAngle + TWO_PI;
    }

    const alpha = (stopAngle - startAngle) / 2;
    const cos = Math.cos(alpha);
    const sin = Math.sin(alpha);
    const cot = 1 / Math.tan(alpha);

    const phi = startAngle + alpha;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const lambda = (4 - cos) / 3;

    const mu = sin + (cos - lambda) * cot;

    const lambdaCosPhi = lambda * cosPhi;
    const lambdaSinPhi = lambda * sinPhi;
    const muCosPhi = mu * cosPhi;
    const muSinPhi = mu * sinPhi;

    return {
      // [cx + Math.cos(startAngle) * r, cy + Math.sin(startAngle) * r],
      c1: {
        x: (cx + lambdaCosPhi + muSinPhi) * r,
        y: (cy + lambdaSinPhi - muCosPhi) * r - k,
      },
      c2: {
        x: (cx + lambdaCosPhi - muSinPhi) * r,
        y: (cy + lambdaSinPhi + muCosPhi) * r + k,
      },
      e: {
        x: cx + Math.cos(stopAngle) * r,
        y: cy + Math.sin(stopAngle) * r,
      },
    };
  };

  const startEnd: BezierPoint = {
    c1: {
      x: 0,
      y: 0,
    },
    c2: {
      x: 0,
      y: 0,
    },
    e: {
      x: cx + Math.cos(startAngle) * r,
      y: cy + Math.sin(startAngle) * r,
    },
  };

  const coords = [
    startEnd,
    getBezierCoords(startAngle, startAngle + angleExtent * 0.5),
    getBezierCoords(startAngle + angleExtent * 0.5, startAngle + angleExtent),
    { c1: { x: 0, y: 0 }, c2: { x: 0, y: 0 }, e: { x: 0, y: 0 } },
    startEnd,
  ];

  return coords.map(({ c1, c2, e }) => ({
    c1: {
      x: c1.x,
      y: c1.y + r * 0.5,
    },
    c2: {
      x: c2.x,
      y: c2.y + r * 0.5,
    },
    e: {
      x: e.x,
      y: e.y + r * 0.5,
    },
  }));
};

const coordsToPathData = (coords: BezierPoint[]): string => {
  const ctx = path();

  ctx.moveTo(coords[0].e.x, coords[0].e.y);
  coords.slice(1).forEach(({ c1, c2, e }) => {
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, e.x, e.y);
  });
  ctx.closePath();

  return ctx.toString();
};

export function getPathData(props: PathProps): string {
  let coords: BezierPoint[];

  switch (props.type) {
    case "bar":
      coords = getRectangleCoords(props);
      break;
    case "bubble":
      coords = getCircleCoords(props);
      break;
    case "pie":
      coords = getPieCoords(props);
      break;
  }

  return coordsToPathData(coords);
}

export const BAR = getPathData({
  type: "bar",
  width: 0,
  height: 0,
  cartoonize: false,
});

export const BUBBLE = getPathData({
  type: "bubble",
  r: 0,
  cartoonize: false,
});
