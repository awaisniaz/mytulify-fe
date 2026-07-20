"use client";

import { makeReg } from "./_util";
import {
  ImageConvert, ResizeImage, CompressImage, RotateImage, FlipImage, FilterImage, CircleCrop,
  WatermarkImage, MemeGenerator, ImageToBase64, Base64ToImage, FaviconGenerator,
  CropImage, PassportPhoto, CombineImages,
} from "@/components/tools/impl/image";
import { HeicToJpg, PngToSvg, CollageMaker } from "@/components/tools/impl/image-extra";
import { ImageColorPicker } from "@/components/tools/impl/color";
import { ImagesToPdf } from "@/components/tools/impl/pdf";
import {
  GifMaker, GifResizer, GifRotator, GifTrimmer, GifOptimizer,
  GifToPng, GifToJpg, GifToWebp, GifToVideo,
} from "@/components/tools/impl/asli-gap";
import { AspectRatioCalculator } from "@/components/tools/impl/demand-extra";
import { HomeColorVisualizer } from "@/components/tools/impl/home-color-visualizer";

export default makeReg({
  "resize-image": ResizeImage,
  "compress-image": CompressImage,
  "rotate-image": RotateImage,
  "flip-image": FlipImage,
  "webp-to-png": () => <ImageConvert to="png" />,
  "webp-to-jpg": () => <ImageConvert to="jpeg" />,
  "png-to-jpg": () => <ImageConvert to="jpeg" />,
  "jpg-to-png": () => <ImageConvert to="png" />,
  "png-to-webp": () => <ImageConvert to="webp" />,
  "jpg-to-webp": () => <ImageConvert to="webp" />,
  "grayscale-image": () => <FilterImage kind="grayscale" />,
  "blur-image": () => <FilterImage kind="blur" />,
  "pixelate-image": () => <FilterImage kind="pixelate" />,
  "circle-crop-image": CircleCrop,
  "add-watermark-to-image": WatermarkImage,
  "meme-generator": MemeGenerator,
  "image-to-base64": ImageToBase64,
  "base64-to-image": Base64ToImage,
  "favicon-generator": FaviconGenerator,
  "image-to-pdf": ImagesToPdf,
  "crop-image": CropImage,
  "passport-photo-maker": PassportPhoto,
  "combine-images": CombineImages,
  "svg-to-png": () => <ImageConvert to="png" />,
  "image-to-ico": FaviconGenerator,
  "image-color-picker": () => <ImageColorPicker />,
  "color-extractor-from-image": () => <ImageColorPicker extract />,
  "heic-to-jpg": HeicToJpg,
  "png-to-svg": PngToSvg,
  "collage-maker": CollageMaker,
  "jfif-to-jpg": () => <ImageConvert to="jpeg" />,
  "jfif-to-png": () => <ImageConvert to="png" />,
  "bmp-to-jpg": () => <ImageConvert to="jpeg" />,
  "bmp-to-pdf": ImagesToPdf,
  "avif-to-jpg": () => <ImageConvert to="jpeg" />,
  "avif-to-webp": () => <ImageConvert to="webp" />,
  "gif-maker": GifMaker,
  "gif-resizer": GifResizer,
  "gif-rotator": GifRotator,
  "gif-trimmer": GifTrimmer,
  "gif-optimizer": GifOptimizer,
  "gif-to-png": GifToPng,
  "gif-to-jpg": GifToJpg,
  "gif-to-webp": GifToWebp,
  "gif-to-video": GifToVideo,
  "aspect-ratio-calculator": AspectRatioCalculator,
  "home-color-visualizer": HomeColorVisualizer,
});
