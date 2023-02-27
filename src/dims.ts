export type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ResolvedDimensions = {
  fullWidth: number;
  width: number;
  fullHeight: number;
  height: number;
  size: number;
  margin: Margin;
  BASE_MARGIN: number;
};

export class Dimensions {
  public BASE_MARGIN = 16;

  public fullWidth: number;
  public fullHeight: number;
  public width: number;
  public height: number;

  public top = this.BASE_MARGIN;
  public right = this.BASE_MARGIN;
  public bottom = this.BASE_MARGIN;
  public left = this.BASE_MARGIN;

  constructor(width: number, height: number) {
    this.fullWidth = width;
    this.width = width - this.left - this.right;
    this.fullHeight = height;
    this.height = height - this.top - this.bottom;
  }

  resolve(): ResolvedDimensions {
    return {
      fullWidth: this.fullWidth,
      width: this.width,
      fullHeight: this.fullHeight,
      height: this.height,
      size: Math.min(this.width, this.height),
      margin: this.margin,
      BASE_MARGIN: this.BASE_MARGIN,
    };
  }

  get margin(): Margin {
    return {
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left,
    };
  }

  public addTop(top: number): this {
    this.top += top;
    this.height -= top;

    return this;
  }

  public addRight(right: number): this {
    this.right += right;
    this.width -= right;

    return this;
  }

  public addBottom(bottom: number): this {
    this.bottom += bottom;
    this.height -= bottom;

    return this;
  }

  public addLeft(left: number): this {
    this.left += left;
    this.width -= left;

    return this;
  }
}
