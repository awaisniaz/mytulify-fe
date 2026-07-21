"use client";

import { makeReg } from "./_util";
import {
  ContractGenerator,
  ProposalGenerator,
  NdaGenerator,
  RateCalculator,
  QuoteCalculator,
  LateFeeCalculator,
  BreakEvenCalculator,
  SelfEmploymentTaxCalculator,
  ClientOnboardingForm,
  ChangeOrderGenerator,
} from "@/components/tools/impl/freelancer";
import { EmailTemplatesGenerator } from "@/components/tools/impl/email-templates-generator";

export default makeReg({
  "contract-generator": ContractGenerator,
  "proposal-generator": ProposalGenerator,
  "nda-generator": NdaGenerator,
  "rate-calculator": RateCalculator,
  "quote-calculator": QuoteCalculator,
  "late-fee-calculator": LateFeeCalculator,
  "break-even-calculator": BreakEvenCalculator,
  "self-employment-tax-calculator": SelfEmploymentTaxCalculator,
  "client-onboarding-form": ClientOnboardingForm,
  "change-order-generator": ChangeOrderGenerator,
  "email-templates-generator": EmailTemplatesGenerator,
});
