export type PickerColor = {
  hex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  cmyk: [number, number, number, number]
  hsv: [number, number, number]
}

export default class ColorPicker {
  constructor(options?: { onChange?: (color: PickerColor) => void; onClose?: (color: PickerColor) => void })
  el: HTMLDivElement
  isOpen: boolean
  readonly color: PickerColor
  open(anchor: Element, color?: string): void
  close(): void
  setColor(color: string): void
  static parse(text: string): [number, number, number] | null
  static hsvToRgb(h: number, s: number, v: number): [number, number, number]
  static hex(rgb: [number, number, number]): string
}
