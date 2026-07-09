"use client";

import { makeReg } from "./_util";
import {
  BmiCalculator, PercentageCalculator, AgeCalculator, LoanCalculator, CompoundInterest,
  TipCalculator, DiscountCalculator, SalesTaxCalculator, BmrCalculator, TdeeCalculator,
  CalorieCalculator, IdealWeight, BodyFat, DueDate, GpaCalculator, GradeCalculator,
  FractionCalculator, ScientificCalculator, DateCalculator, HoursCalculator, CountdownCalculator,
  SalaryCalculator, PaycheckCalculator, SleepCalculator, StdDeviation,
} from "@/components/tools/impl/calc";
import { RandomNumber } from "@/components/tools/impl/data";
import {
  AfghanDateConverter, ZakatCalculator, TasbihCounter, SalaryTaxCalculator,
} from "@/components/tools/impl/asli-gap";

export default makeReg({
  "bmi-calculator": BmiCalculator,
  "percentage-calculator": PercentageCalculator,
  "age-calculator": AgeCalculator,
  "loan-calculator": () => <LoanCalculator />,
  "mortgage-calculator": () => <LoanCalculator mortgage />,
  "compound-interest-calculator": CompoundInterest,
  "tip-calculator": TipCalculator,
  "discount-calculator": DiscountCalculator,
  "sales-tax-calculator": SalesTaxCalculator,
  "calorie-calculator": CalorieCalculator,
  "bmr-calculator": BmrCalculator,
  "tdee-calculator": TdeeCalculator,
  "body-fat-calculator": BodyFat,
  "ideal-weight-calculator": IdealWeight,
  "due-date-calculator": () => <DueDate mode="due" />,
  "ovulation-calculator": () => <DueDate mode="ovulation" />,
  "pregnancy-calculator": () => <DueDate mode="pregnancy" />,
  "gpa-calculator": GpaCalculator,
  "grade-calculator": GradeCalculator,
  "fraction-calculator": FractionCalculator,
  "scientific-calculator": ScientificCalculator,
  "date-calculator": DateCalculator,
  "hours-calculator": HoursCalculator,
  "time-duration-calculator": HoursCalculator,
  "countdown-calculator": CountdownCalculator,
  "paycheck-calculator": PaycheckCalculator,
  "salary-calculator": SalaryCalculator,
  "sleep-calculator": SleepCalculator,
  "random-number-generator": RandomNumber,
  "standard-deviation-calculator": StdDeviation,
  "zakat-calculator": ZakatCalculator,
  "afghan-date-converter": AfghanDateConverter,
  "tasbih-counter": TasbihCounter,
  "salary-tax-calculator": SalaryTaxCalculator,
});
