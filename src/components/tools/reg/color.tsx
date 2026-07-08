"use client";

import { makeReg } from "./_util";
import {
  ColorConverter, PaletteGenerator, GradientGenerator, ContrastChecker, ShadesTints,
  ColorMixer, RandomColor, Harmony, ShadowGenerator, LightenDarken,
  ColorNameFinder, HexToImage, ColorBlindnessSim, ImageColorPicker,
} from "@/components/tools/impl/color";

const WHEEL = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export default makeReg({
  "color-picker": ColorConverter,
  "hex-to-rgb": ColorConverter,
  "rgb-to-hex": ColorConverter,
  "hex-to-hsl": ColorConverter,
  "hsl-to-hex": ColorConverter,
  "rgb-to-hsl": ColorConverter,
  "rgb-to-cmyk": ColorConverter,
  "cmyk-to-rgb": ColorConverter,
  "hex-to-cmyk": ColorConverter,
  "hex-to-rgba": ColorConverter,
  "color-palette-generator": PaletteGenerator,
  "gradient-generator": GradientGenerator,
  "css-gradient-background-generator": GradientGenerator,
  "color-contrast-checker": ContrastChecker,
  "color-shades-generator": () => <ShadesTints mode="shades" />,
  "color-tints-generator": () => <ShadesTints mode="tints" />,
  "monochromatic-color-generator": () => <ShadesTints mode="both" />,
  "color-wheel": () => <Harmony offsets={WHEEL} title="Color wheel harmony" />,
  "complementary-color-finder": () => <Harmony offsets={[0, 180]} title="Complementary" />,
  "analogous-color-generator": () => <Harmony offsets={[-30, 0, 30]} title="Analogous" />,
  "triadic-color-generator": () => <Harmony offsets={[0, 120, 240]} title="Triadic" />,
  "color-mixer": ColorMixer,
  "random-color-generator": RandomColor,
  "box-shadow-generator": () => <ShadowGenerator kind="box" />,
  "text-shadow-generator": () => <ShadowGenerator kind="text" />,
  "lighten-darken-color": LightenDarken,
  "color-name-finder": ColorNameFinder,
  "hex-color-to-image": HexToImage,
  "color-blindness-simulator": ColorBlindnessSim,
  "color-from-image": () => <ImageColorPicker />,
});
