"use client";

import { makeReg } from "./_util";
import {
  FactorConverter, TemperatureConverter, FuelConverter, RomanConverter, NumberToWords,
  BaseConverter, TimeZoneConverter, ShoeSizeConverter, RingSizeConverter, BraSizeConverter, ClothingSizeConverter,
  LENGTH, WEIGHT, VOLUME, AREA, SPEED, TIME, PRESSURE, ENERGY, POWER, FORCE, ANGLE,
  DATA, DATARATE, DENSITY, FREQUENCY, COOKING,
} from "@/components/tools/impl/unit-converter";
import { ColorConverter } from "@/components/tools/impl/color";

export default makeReg({
  "length-converter": () => <FactorConverter units={LENGTH} from="Meter" to="Foot" />,
  "weight-converter": () => <FactorConverter units={WEIGHT} from="Kilogram" to="Pound" />,
  "temperature-converter": TemperatureConverter,
  "volume-converter": () => <FactorConverter units={VOLUME} from="Liter" to="Gallon (US)" />,
  "area-converter": () => <FactorConverter units={AREA} from="Square Meter" to="Square Foot" />,
  "speed-converter": () => <FactorConverter units={SPEED} from="Kilometer/hour" to="Mile/hour" />,
  "time-converter": () => <FactorConverter units={TIME} from="Hour" to="Minute" />,
  "pressure-converter": () => <FactorConverter units={PRESSURE} from="Bar" to="PSI" />,
  "energy-converter": () => <FactorConverter units={ENERGY} from="Joule" to="Calorie" />,
  "power-converter": () => <FactorConverter units={POWER} from="Kilowatt" to="Horsepower" />,
  "force-converter": () => <FactorConverter units={FORCE} from="Newton" to="Pound-force" />,
  "angle-converter": () => <FactorConverter units={ANGLE} from="Degree" to="Radian" />,
  "data-storage-converter": () => <FactorConverter units={DATA} from="Megabyte" to="Gigabyte" />,
  "data-transfer-rate-converter": () => <FactorConverter units={DATARATE} from="Mbit/s" to="MB/s" />,
  "fuel-consumption-converter": FuelConverter,
  "density-converter": () => <FactorConverter units={DENSITY} from="kg/m³" to="g/cm³" />,
  "frequency-converter": () => <FactorConverter units={FREQUENCY} from="Hertz" to="Kilohertz" />,
  "cooking-measurement-converter": () => <FactorConverter units={COOKING} from="Cup" to="Tablespoon" />,
  "shoe-size-converter": ShoeSizeConverter,
  "roman-numeral-converter": RomanConverter,
  "number-to-words-converter": NumberToWords,
  "binary-to-decimal-converter": BaseConverter,
  "hex-to-rgb-converter": ColorConverter,
  "inches-to-cm-converter": () => <FactorConverter units={LENGTH} from="Inch" to="Centimeter" defaultValue={12} />,
  "kg-to-lbs-converter": () => <FactorConverter units={WEIGHT} from="Kilogram" to="Pound" />,
  "liters-to-gallons-converter": () => <FactorConverter units={VOLUME} from="Liter" to="Gallon (US)" />,
  "time-zone-converter": TimeZoneConverter,
  "ring-size-converter": RingSizeConverter,
  "bra-size-converter": BraSizeConverter,
  "clothing-size-converter": ClothingSizeConverter,
});
