"use client";

import { makeReg } from "./_util";
import {
  WaterIntake,
  MacroCalculator,
  HeartRateZones,
  CaloriesBurned,
  OneRepMax,
  PaceCalculator,
  BacCalculator,
  ProteinIntake,
  WaistToHip,
  BodySurfaceArea,
} from "@/components/tools/impl/health";

export default makeReg({
  "water-intake-calculator": WaterIntake,
  "macro-calculator": MacroCalculator,
  "heart-rate-zone-calculator": HeartRateZones,
  "calories-burned-calculator": CaloriesBurned,
  "one-rep-max-calculator": OneRepMax,
  "pace-calculator": PaceCalculator,
  "bac-calculator": BacCalculator,
  "protein-intake-calculator": ProteinIntake,
  "waist-to-hip-ratio-calculator": WaistToHip,
  "body-surface-area-calculator": BodySurfaceArea,
});
