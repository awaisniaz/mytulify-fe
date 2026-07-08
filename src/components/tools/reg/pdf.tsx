"use client";

import { makeReg } from "./_util";
import {
  MergePdf, ImagesToPdf, RotatePdf, DeletePdfPages, ExtractPdfPages, ReversePdfPages,
  AddPageNumbers, WatermarkPdf, PdfPageCounter, SplitPdf, DuplicatePdfPages, CompressPdf,
} from "@/components/tools/impl/pdf";
import {
  OrganizePdf, SplitPdfInHalf, ResizePdf, CropPdf, SignPdf, EditPdf, FillPdfForm,
  ProtectPdf, UnlockPdf, PdfToJpg, PdfToPng, ExtractImagesFromPdf, ExtractTextFromPdf,
  PdfToWord, WordToPdf,
} from "@/components/tools/impl/pdf-advanced";

export default makeReg({
  "merge-pdf": MergePdf,
  "split-pdf": SplitPdf,
  "rotate-pdf": RotatePdf,
  "delete-pdf-pages": DeletePdfPages,
  "extract-pdf-pages": ExtractPdfPages,
  "reverse-pdf-pages": ReversePdfPages,
  "add-page-numbers-to-pdf": AddPageNumbers,
  "add-watermark-to-pdf": WatermarkPdf,
  "pdf-page-counter": PdfPageCounter,
  "jpg-to-pdf": ImagesToPdf,
  "png-to-pdf": ImagesToPdf,
  "images-to-pdf": ImagesToPdf,
  "duplicate-pdf-pages": DuplicatePdfPages,
  "compress-pdf": CompressPdf,
  "flatten-pdf": CompressPdf,
  "organize-pdf": OrganizePdf,
  "split-pdf-in-half": SplitPdfInHalf,
  "resize-pdf": ResizePdf,
  "crop-pdf": CropPdf,
  "sign-pdf": SignPdf,
  "edit-pdf": EditPdf,
  "fill-pdf-form": FillPdfForm,
  "protect-pdf": ProtectPdf,
  "unlock-pdf": UnlockPdf,
  "pdf-to-jpg": PdfToJpg,
  "pdf-to-png": PdfToPng,
  "extract-images-from-pdf": ExtractImagesFromPdf,
  "extract-text-from-pdf": ExtractTextFromPdf,
  "pdf-to-word": PdfToWord,
  "word-to-pdf": WordToPdf,
});
