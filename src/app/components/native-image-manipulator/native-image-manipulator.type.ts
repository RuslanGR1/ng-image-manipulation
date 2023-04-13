export interface RGBColor {
  R: number;
  G: number;
  B: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ImageBackgroundOpacityParams {
  image: HTMLImageElement;
  imgWidth: number;
  imgHeight: number;
}

export enum UserAction {
  ClickTap = 'click tap',
  KeyDown = 'keydown',
  Transform = 'transform'
}

export enum ChangePriorityAction {
  Increase = 'increase',
  Decrease = 'decrease'
}
