// 0.5 seems too much.
export const HALF_FONT_K = 0.42;

export const TEXT_MARGIN = 8;

export const PADDING = 4;

export const STROKE_WIDTH = 1;

export const getRotate = (_rotate = 0, cartoonize?: boolean): number => {
  const rotate = _rotate <= -90 ? -180 : _rotate <= 90 ? 0 : 180;

  return rotate + (cartoonize ? Math.random() * 20 - 10 : 0);
};

export const getGroupLabelStrokeWidth = (labelFontSize: number): number => {
  return labelFontSize ? 3 : 0;
};
