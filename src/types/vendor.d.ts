declare module "js-md4" {
  function md4(input: ArrayBuffer | Uint8Array | string): string;
  export default md4;
}

declare module "heic2any" {
  interface HeicOptions {
    blob: Blob;
    toType?: string;
    quality?: number;
  }
  function heic2any(options: HeicOptions): Promise<Blob | Blob[]>;
  export default heic2any;
}

declare module "gifenc" {
  export function quantize(rgba: Uint8ClampedArray | Uint8Array, maxColors: number): number[][];
  export function applyPalette(rgba: Uint8ClampedArray | Uint8Array, palette: number[][]): Uint8Array;
  export function GIFEncoder(): {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: number[][]; delay?: number; transparent?: boolean },
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
  };
}
