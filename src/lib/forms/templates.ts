import type { FormField, FormSchema } from "./schema";
import type { FormTemplate } from "./template-types";
import { mergeBranding } from "./branding";
import { FORM_COUNTRIES } from "./countries";
import { FORM_CATEGORIES } from "./template-blueprints";
import {
  getAllGeneratedTemplates,
  getGeneratedForCountry,
  getGlobalGeneratedTemplates,
} from "./template-generator";

export type { FormTemplate } from "./template-types";

export const CUSTOM_TEMPLATE_ID = "custom";

export { FORM_COUNTRIES } from "./countries";

function f(
  id: string,
  type: FormField["type"],
  label: string,
  extra?: Partial<FormField>,
): FormField {
  return { id, type, label, required: extra?.required ?? false, ...extra };
}

function tpl(
  id: string,
  name: string,
  country: string,
  countryLabel: string,
  category: string,
  language: string,
  title: string,
  description: string,
  fields: FormField[],
): FormTemplate {
  return {
    id,
    name,
    country,
    countryLabel,
    category,
    language,
    schema: { title, description, language, fields },
  };
}

/** Hand-crafted forms with localized titles and country-specific fields. */
export const MANUAL_TEMPLATES: FormTemplate[] = [
  /* ── Universal ── */
  tpl("global-contact", "Contact Form", "global", "Universal", "General", "en", "Contact Form", "General inquiry and contact details.", [
    f("full_name", "text", "Full name", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("phone", "phone", "Phone"),
    f("subject", "text", "Subject", { required: true }),
    f("message", "textarea", "Message", { required: true }),
  ]),
  tpl("global-event", "Event Registration", "global", "Universal", "General", "en", "Event Registration", "Register attendees for an event.", [
    f("name", "text", "Full name", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("phone", "phone", "Phone"),
    f("ticket", "select", "Ticket type", { required: true, options: ["Standard", "VIP", "Student"] }),
    f("dietary", "text", "Dietary requirements"),
    f("consent", "checkbox", "I agree to event terms", { required: true }),
  ]),
  tpl("global-feedback", "Feedback Survey", "global", "Universal", "General", "en", "Feedback Survey", "Collect customer or user feedback.", [
    f("name", "text", "Name"),
    f("rating", "radio", "Overall rating", { required: true, options: ["Excellent", "Good", "Average", "Poor"] }),
    f("liked", "textarea", "What did you like?"),
    f("improve", "textarea", "What can we improve?"),
    f("recommend", "radio", "Would you recommend us?", { options: ["Yes", "No", "Maybe"] }),
  ]),
  tpl("global-volunteer", "Volunteer Registration", "global", "Universal", "General", "en", "Volunteer Registration", "Sign up volunteers for programs.", [
    f("name", "text", "Full name", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("phone", "phone", "Phone", { required: true }),
    f("skills", "textarea", "Skills & experience"),
    f("availability", "text", "Availability"),
    f("emergency_contact", "text", "Emergency contact"),
    f("signature", "signature", "Signature", { required: true }),
  ]),
  tpl("global-invoice", "Invoice / Bill", "global", "Universal", "Business", "en", "Invoice", "Bill clients for products or services.", [
    f("invoice_no", "text", "Invoice number", { required: true }),
    f("date", "date", "Invoice date", { required: true }),
    f("seller", "textarea", "Seller / company details", { required: true }),
    f("buyer", "textarea", "Buyer details", { required: true }),
    f("items", "textarea", "Items & amounts", { required: true }),
    f("total", "number", "Total amount", { required: true }),
    f("payment_terms", "text", "Payment terms"),
  ]),
  tpl("global-quote", "Quote Request", "global", "Universal", "Business", "en", "Quote Request", "Request a price quotation.", [
    f("company", "text", "Company name"),
    f("contact", "text", "Contact person", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("phone", "phone", "Phone"),
    f("requirements", "textarea", "Requirements / scope", { required: true }),
    f("deadline", "date", "Required by date"),
  ]),
  tpl("global-membership", "Membership Application", "global", "Universal", "General", "en", "Membership Application", "Join an organization or club.", [
    f("name", "text", "Full name", { required: true }),
    f("dob", "date", "Date of birth"),
    f("address", "textarea", "Address", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("membership_type", "select", "Membership type", { options: ["Individual", "Family", "Corporate"] }),
    f("signature", "signature", "Signature", { required: true }),
  ]),
  tpl("global-consent", "Consent Form", "global", "Universal", "Legal", "en", "Consent Form", "General consent and acknowledgment.", [
    f("participant", "text", "Participant name", { required: true }),
    f("guardian", "text", "Parent / guardian (if minor)"),
    f("purpose", "textarea", "Purpose of consent", { required: true }),
    f("acknowledge", "checkbox", "I have read and agree", { required: true }),
    f("date", "date", "Date", { required: true }),
    f("signature", "signature", "Signature", { required: true }),
  ]),
  tpl("global-nda", "Non-Disclosure Agreement (NDA)", "global", "Universal", "Legal", "en", "Non-Disclosure Agreement", "Mutual confidentiality agreement.", [
    f("party_a", "text", "Party A (disclosing)", { required: true }),
    f("party_b", "text", "Party B (receiving)", { required: true }),
    f("effective_date", "date", "Effective date", { required: true }),
    f("purpose", "textarea", "Purpose of disclosure", { required: true }),
    f("duration", "text", "Confidentiality period"),
    f("signature_a", "signature", "Party A signature", { required: true }),
    f("signature_b", "signature", "Party B signature", { required: true }),
  ]),
  tpl("global-leave", "Leave Application", "global", "Universal", "Employment", "en", "Leave Application", "Employee leave request.", [
    f("employee_name", "text", "Employee name", { required: true }),
    f("employee_id", "text", "Employee ID"),
    f("department", "text", "Department"),
    f("leave_type", "select", "Leave type", { options: ["Annual", "Sick", "Unpaid", "Other"] }),
    f("from_date", "date", "From", { required: true }),
    f("to_date", "date", "To", { required: true }),
    f("reason", "textarea", "Reason"),
    f("signature", "signature", "Employee signature", { required: true }),
  ]),
  tpl("global-medical", "Medical History Form", "global", "Universal", "Medical", "en", "Medical History Form", "Patient medical background intake.", [
    f("patient_name", "text", "Patient name", { required: true }),
    f("dob", "date", "Date of birth", { required: true }),
    f("gender", "radio", "Gender", { options: ["Male", "Female", "Other"] }),
    f("allergies", "textarea", "Allergies"),
    f("medications", "textarea", "Current medications"),
    f("conditions", "textarea", "Past medical conditions"),
    f("emergency_contact", "text", "Emergency contact", { required: true }),
  ]),

  /* ── Pakistan ── */
  tpl("pk-rent", "Rent / Tenancy Agreement", "pk", "Pakistan", "Housing", "ur", "کرایہ نامہ / Rent Agreement", "Residential property rent agreement.", [
    f("landlord_name", "text", "مالک کا نام / Landlord name", { required: true }),
    f("landlord_cnic", "cnic", "مالک CNIC", { required: true }),
    f("tenant_name", "text", "کرایہ دار کا نام / Tenant name", { required: true }),
    f("tenant_cnic", "cnic", "کرایہ دار CNIC", { required: true }),
    f("property_address", "textarea", "مکان کا پتہ / Property address", { required: true }),
    f("monthly_rent", "number", "ماہانہ کرایہ (PKR)", { required: true }),
    f("security_deposit", "number", "سیکیورٹی ڈپازٹ"),
    f("start_date", "date", "معاہدہ شروع", { required: true }),
    f("duration", "text", "مدت / Duration"),
    f("witness_1", "text", "گواہ 1"),
    f("witness_2", "text", "گواہ 2"),
    f("landlord_sign", "signature", "مالک دستخط", { required: true }),
    f("tenant_sign", "signature", "کرایہ دار دستخط", { required: true }),
  ]),
  tpl("pk-job", "Job Application Form", "pk", "Pakistan", "Employment", "ur", "ملازمت درخواست فارم", "Standard job application.", [
    f("name", "text", "نام / Full name", { required: true }),
    f("father_name", "text", "ولدیت / Father name", { required: true }),
    f("cnic", "cnic", "CNIC", { required: true }),
    f("dob", "date", "تاریخ پیدائش"),
    f("email", "email", "Email"),
    f("phone", "phone", "فون", { required: true }),
    f("address", "textarea", "مستقل پتہ", { required: true }),
    f("education", "textarea", "تعلیم", { required: true }),
    f("experience", "textarea", "تجربہ"),
    f("expected_salary", "number", "متوقع تنخواہ (PKR)"),
    f("signature", "signature", "دستخط", { required: true }),
  ]),
  tpl("pk-school", "School Admission Form", "pk", "Pakistan", "Education", "ur", "سکول داخلہ فارم", "Student admission application.", [
    f("student_name", "text", "طالب علم کا نام", { required: true }),
    f("dob", "date", "تاریخ پیدائش", { required: true }),
    f("class", "select", "جماعت", { options: ["Playgroup", "Nursery", "KG", "Class 1-12"] }),
    f("father_name", "text", "والد کا نام", { required: true }),
    f("father_cnic", "cnic", "والد CNIC", { required: true }),
    f("mother_name", "text", "والدہ کا نام"),
    f("phone", "phone", "رابطہ نمبر", { required: true }),
    f("address", "textarea", "پتہ", { required: true }),
    f("previous_school", "text", "سابقہ سکول"),
    f("signature", "signature", "والد دستخط", { required: true }),
  ]),
  tpl("pk-affidavit", "Affidavit (Hamaniyat)", "pk", "Pakistan", "Legal", "ur", "حلف نامہ", "Sworn statement affidavit.", [
    f("deponent_name", "text", "حلف دینے والے کا نام", { required: true }),
    f("cnic", "cnic", "CNIC", { required: true }),
    f("address", "textarea", "پتہ", { required: true }),
    f("statement", "textarea", "حلف نامہ متن / Statement", { required: true }),
    f("place", "text", "مقام"),
    f("date", "date", "تاریخ", { required: true }),
    f("signature", "signature", "دستخط", { required: true }),
  ]),
  tpl("pk-vehicle", "Vehicle Sale Agreement", "pk", "Pakistan", "Legal", "ur", "گاڑی فروخت معاہدہ", "Motor vehicle sale between parties.", [
    f("seller_name", "text", "فروخت کنندہ", { required: true }),
    f("seller_cnic", "cnic", "فروخت کنندہ CNIC", { required: true }),
    f("buyer_name", "text", "خریدار", { required: true }),
    f("buyer_cnic", "cnic", "خریدار CNIC", { required: true }),
    f("vehicle", "text", "گاڑی (ماڈل، رجسٹریشن)", { required: true }),
    f("price", "number", "قیمت (PKR)", { required: true }),
    f("date", "date", "تاریخ", { required: true }),
    f("seller_sign", "signature", "فروخت کنندہ دستخط", { required: true }),
    f("buyer_sign", "signature", "خریدار دستخط", { required: true }),
  ]),
  tpl("pk-ntn", "Business Registration Info", "pk", "Pakistan", "Business", "en", "Business / NTN Registration Info", "Collect details for business tax registration.", [
    f("business_name", "text", "Business name", { required: true }),
    f("owner_name", "text", "Owner name", { required: true }),
    f("cnic", "cnic", "Owner CNIC", { required: true }),
    f("ntn", "text", "NTN (if existing)"),
    f("address", "textarea", "Business address", { required: true }),
    f("business_type", "select", "Type", { options: ["Sole proprietorship", "Partnership", "Private Ltd"] }),
    f("bank_account", "text", "Bank account"),
  ]),

  /* ── United States ── */
  tpl("us-lease", "Residential Lease Agreement", "us", "United States", "Housing", "en", "Residential Lease Agreement", "Standard US rental lease.", [
    f("landlord", "text", "Landlord name", { required: true }),
    f("tenant", "text", "Tenant name", { required: true }),
    f("property", "textarea", "Property address", { required: true }),
    f("rent", "number", "Monthly rent (USD)", { required: true }),
    f("deposit", "number", "Security deposit"),
    f("start", "date", "Lease start", { required: true }),
    f("end", "date", "Lease end"),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),
  tpl("us-job", "Job Application", "us", "United States", "Employment", "en", "Job Application Form", "Employment application.", [
    f("name", "text", "Full legal name", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("phone", "phone", "Phone", { required: true }),
    f("address", "textarea", "Address", { required: true }),
    f("ssn_last4", "text", "SSN (last 4 digits)"),
    f("eligible", "radio", "Authorized to work in US?", { options: ["Yes", "No"] }),
    f("education", "textarea", "Education"),
    f("experience", "textarea", "Work experience"),
    f("signature", "signature", "Signature", { required: true }),
  ]),
  tpl("us-w9", "W-9 Information Request", "us", "United States", "Tax", "en", "W-9 Style Information Form", "Taxpayer identification collection.", [
    f("name", "text", "Name (as shown on tax return)", { required: true }),
    f("business_name", "text", "Business name"),
    f("tax_class", "select", "Federal tax classification", { options: ["Individual", "C Corp", "S Corp", "Partnership", "LLC"] }),
    f("address", "textarea", "Address", { required: true }),
    f("tin", "text", "Taxpayer ID (SSN/EIN)", { required: true }),
    f("signature", "signature", "Certification signature", { required: true }),
    f("date", "date", "Date", { required: true }),
  ]),
  tpl("us-medical", "Patient Intake Form", "us", "United States", "Medical", "en", "Patient Intake Form", "New patient medical intake.", [
    f("name", "text", "Patient name", { required: true }),
    f("dob", "date", "Date of birth", { required: true }),
    f("insurance", "text", "Insurance provider"),
    f("policy", "text", "Policy number"),
    f("allergies", "textarea", "Allergies"),
    f("medications", "textarea", "Current medications"),
    f("hipaa", "checkbox", "HIPAA acknowledgment", { required: true }),
  ]),

  /* ── United Kingdom ── */
  tpl("gb-tenancy", "Assured Shorthold Tenancy", "gb", "United Kingdom", "Housing", "en", "Tenancy Agreement (AST)", "UK residential tenancy.", [
    f("landlord", "text", "Landlord name", { required: true }),
    f("tenant", "text", "Tenant name", { required: true }),
    f("property", "textarea", "Property address", { required: true }),
    f("rent", "number", "Monthly rent (GBP)", { required: true }),
    f("deposit", "number", "Deposit (GBP)"),
    f("start", "date", "Tenancy start", { required: true }),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),
  tpl("gb-job", "Job Application", "gb", "United Kingdom", "Employment", "en", "Job Application", "UK employment application.", [
    f("name", "text", "Full name", { required: true }),
    f("ni_number", "text", "National Insurance number"),
    f("email", "email", "Email", { required: true }),
    f("phone", "phone", "Phone", { required: true }),
    f("right_to_work", "checkbox", "Right to work in UK confirmed", { required: true }),
    f("cv_summary", "textarea", "Experience summary"),
    f("signature", "signature", "Signature", { required: true }),
  ]),
  tpl("gb-gp", "GP Registration Form", "gb", "United Kingdom", "Medical", "en", "GP Registration", "Register with a GP surgery.", [
    f("name", "text", "Full name", { required: true }),
    f("dob", "date", "Date of birth", { required: true }),
    f("nhs_number", "text", "NHS number"),
    f("address", "textarea", "Address", { required: true }),
    f("phone", "phone", "Phone", { required: true }),
    f("previous_gp", "text", "Previous GP (if any)"),
  ]),

  /* ── India ── */
  tpl("in-rent", "Rent Agreement", "in", "India", "Housing", "en", "Rent Agreement", "Residential rent agreement India.", [
    f("owner", "text", "Owner name", { required: true }),
    f("tenant", "text", "Tenant name", { required: true }),
    f("aadhaar_owner", "text", "Owner Aadhaar", { required: true }),
    f("aadhaar_tenant", "text", "Tenant Aadhaar", { required: true }),
    f("address", "textarea", "Property address", { required: true }),
    f("rent", "number", "Monthly rent (INR)", { required: true }),
    f("deposit", "number", "Security deposit"),
    f("start", "date", "Start date", { required: true }),
    f("owner_sign", "signature", "Owner signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),
  tpl("in-job", "Job Application", "in", "India", "Employment", "hi", "नौकरी आवेदन पत्र", "Employment application India.", [
    f("name", "text", "पूरा नाम / Full name", { required: true }),
    f("father", "text", "पिता का नाम / Father name"),
    f("aadhaar", "text", "Aadhaar number", { required: true }),
    f("pan", "text", "PAN"),
    f("email", "email", "Email"),
    f("phone", "phone", "Phone", { required: true }),
    f("address", "textarea", "Address", { required: true }),
    f("qualification", "textarea", "Qualification"),
    f("signature", "signature", "Signature", { required: true }),
  ]),
  tpl("in-gst", "GST Tax Invoice", "in", "India", "Business", "en", "GST Tax Invoice", "GST compliant invoice format.", [
    f("seller", "textarea", "Seller details & GSTIN", { required: true }),
    f("buyer", "textarea", "Buyer details & GSTIN", { required: true }),
    f("invoice_no", "text", "Invoice number", { required: true }),
    f("date", "date", "Invoice date", { required: true }),
    f("items", "textarea", "Items (HSN, qty, rate, tax)", { required: true }),
    f("total", "number", "Total (INR)", { required: true }),
  ]),

  /* ── UAE ── */
  tpl("ae-tenancy", "Tenancy Contract (Ejari)", "ae", "United Arab Emirates", "Housing", "en", "Tenancy Contract", "UAE rental contract details.", [
    f("landlord", "text", "Landlord name", { required: true }),
    f("tenant", "text", "Tenant name", { required: true }),
    f("emirates_id", "text", "Tenant Emirates ID", { required: true }),
    f("property", "textarea", "Property address", { required: true }),
    f("rent", "number", "Annual rent (AED)", { required: true }),
    f("cheques", "select", "Payment cheques", { options: ["1", "2", "4", "6", "12"] }),
    f("start", "date", "Contract start", { required: true }),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),
  tpl("ae-employment", "Employment Contract", "ae", "United Arab Emirates", "Employment", "en", "Employment Contract", "UAE labor contract info.", [
    f("employer", "text", "Employer", { required: true }),
    f("employee", "text", "Employee name", { required: true }),
    f("passport", "text", "Passport number", { required: true }),
    f("nationality", "text", "Nationality"),
    f("job_title", "text", "Job title", { required: true }),
    f("salary", "number", "Basic salary (AED)", { required: true }),
    f("start", "date", "Start date", { required: true }),
  ]),

  /* ── Saudi Arabia ── */
  tpl("sa-lease", "Residential Lease", "sa", "Saudi Arabia", "Housing", "ar", "عقد إيجار سكني", "Saudi residential lease.", [
    f("landlord", "text", "اسم المؤجر", { required: true }),
    f("tenant", "text", "اسم المستأجر", { required: true }),
    f("iqama", "text", "رقم الإقامة / Iqama", { required: true }),
    f("property", "textarea", "عنوان العقار", { required: true }),
    f("rent", "number", "الإيجار السنوي (SAR)", { required: true }),
    f("start", "date", "تاريخ البداية", { required: true }),
    f("landlord_sign", "signature", "توقيع المؤجر", { required: true }),
    f("tenant_sign", "signature", "توقيع المستأجر", { required: true }),
  ]),
  tpl("sa-job", "Job Application", "sa", "Saudi Arabia", "Employment", "ar", "طلب توظيف", "Employment application KSA.", [
    f("name", "text", "الاسم الكامل", { required: true }),
    f("iqama", "text", "رقم الإقامة / الهوية", { required: true }),
    f("nationality", "text", "الجنسية"),
    f("email", "email", "Email"),
    f("phone", "phone", "Phone", { required: true }),
    f("qualification", "textarea", "المؤهل"),
    f("signature", "signature", "التوقيع", { required: true }),
  ]),

  /* ── Germany ── */
  tpl("de-mietvertrag", "Mietvertrag", "de", "Germany", "Housing", "de", "Mietvertrag", "Deutscher Wohnraummietvertrag.", [
    f("vermieter", "text", "Vermieter", { required: true }),
    f("mieter", "text", "Mieter", { required: true }),
    f("adresse", "textarea", "Mietobjekt Adresse", { required: true }),
    f("miete", "number", "Kaltmiete (EUR)", { required: true }),
    f("kaution", "number", "Kaution"),
    f("beginn", "date", "Mietbeginn", { required: true }),
    f("vermieter_sign", "signature", "Unterschrift Vermieter", { required: true }),
    f("mieter_sign", "signature", "Unterschrift Mieter", { required: true }),
  ]),
  tpl("de-bewerbung", "Bewerbungsformular", "de", "Germany", "Employment", "de", "Bewerbungsformular", "Stellenbewerbung.", [
    f("name", "text", "Name", { required: true }),
    f("email", "email", "E-Mail", { required: true }),
    f("phone", "phone", "Telefon", { required: true }),
    f("geburtsdatum", "date", "Geburtsdatum"),
    f("anschrift", "textarea", "Anschrift", { required: true }),
    f("qualifikation", "textarea", "Qualifikation"),
    f("unterschrift", "signature", "Unterschrift", { required: true }),
  ]),

  /* ── France ── */
  tpl("fr-bail", "Contrat de location", "fr", "France", "Housing", "fr", "Contrat de location", "Bail de location résidentiel.", [
    f("bailleur", "text", "Bailleur", { required: true }),
    f("locataire", "text", "Locataire", { required: true }),
    f("adresse", "textarea", "Adresse du logement", { required: true }),
    f("loyer", "number", "Loyer mensuel (EUR)", { required: true }),
    f("depot", "number", "Dépôt de garantie"),
    f("debut", "date", "Date de début", { required: true }),
    f("sig_bailleur", "signature", "Signature bailleur", { required: true }),
    f("sig_locataire", "signature", "Signature locataire", { required: true }),
  ]),
  tpl("fr-candidature", "Candidature emploi", "fr", "France", "Employment", "fr", "Candidature", "Demande d'emploi.", [
    f("nom", "text", "Nom complet", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("telephone", "phone", "Téléphone", { required: true }),
    f("adresse", "textarea", "Adresse"),
    f("experience", "textarea", "Expérience"),
    f("signature", "signature", "Signature", { required: true }),
  ]),

  /* ── Spain ── */
  tpl("es-alquiler", "Contrato de alquiler", "es", "Spain", "Housing", "es", "Contrato de alquiler", "Contrato de arrendamiento.", [
    f("arrendador", "text", "Arrendador", { required: true }),
    f("arrendatario", "text", "Arrendatario", { required: true }),
    f("direccion", "textarea", "Dirección del inmueble", { required: true }),
    f("renta", "number", "Renta mensual (EUR)", { required: true }),
    f("fianza", "number", "Fianza"),
    f("inicio", "date", "Fecha de inicio", { required: true }),
    f("firma_arrendador", "signature", "Firma arrendador", { required: true }),
    f("firma_arrendatario", "signature", "Firma arrendatario", { required: true }),
  ]),

  /* ── China ── */
  tpl("cn-lease", "房屋租赁合同", "cn", "China", "Housing", "zh", "房屋租赁合同", "Residential lease agreement.", [
    f("landlord", "text", "出租人", { required: true }),
    f("tenant", "text", "承租人", { required: true }),
    f("id_landlord", "text", "出租人身份证号", { required: true }),
    f("id_tenant", "text", "承租人身份证号", { required: true }),
    f("address", "textarea", "房屋地址", { required: true }),
    f("rent", "number", "月租金 (CNY)", { required: true }),
    f("start", "date", "起租日期", { required: true }),
    f("landlord_sign", "signature", "出租人签名", { required: true }),
    f("tenant_sign", "signature", "承租人签名", { required: true }),
  ]),

  /* ── Brazil ── */
  tpl("br-aluguel", "Contrato de locação", "br", "Brazil", "Housing", "pt", "Contrato de locação", "Contrato de aluguel residencial.", [
    f("locador", "text", "Locador", { required: true }),
    f("locatario", "text", "Locatário", { required: true }),
    f("cpf_locador", "text", "CPF locador", { required: true }),
    f("cpf_locatario", "text", "CPF locatário", { required: true }),
    f("endereco", "textarea", "Endereço do imóvel", { required: true }),
    f("aluguel", "number", "Aluguel mensal (BRL)", { required: true }),
    f("inicio", "date", "Data início", { required: true }),
    f("sig_locador", "signature", "Assinatura locador", { required: true }),
    f("sig_locatario", "signature", "Assinatura locatário", { required: true }),
  ]),

  /* ── Turkey ── */
  tpl("tr-kira", "Kira Sözleşmesi", "tr", "Turkey", "Housing", "tr", "Kira Sözleşmesi", "Konut kira sözleşmesi.", [
    f("ev_sahibi", "text", "Ev sahibi", { required: true }),
    f("kiraci", "text", "Kiracı", { required: true }),
    f("tc", "text", "TC Kimlik No", { required: true }),
    f("adres", "textarea", "Konut adresi", { required: true }),
    f("kira", "number", "Aylık kira (TRY)", { required: true }),
    f("baslangic", "date", "Başlangıç tarihi", { required: true }),
    f("ev_sahibi_imza", "signature", "Ev sahibi imza", { required: true }),
    f("kiraci_imza", "signature", "Kiracı imza", { required: true }),
  ]),

  /* ── Bangladesh ── */
  tpl("bd-rent", "Rent Agreement", "bd", "Bangladesh", "Housing", "bn", "ভাড়া চুক্তিপত্র", "Residential rent agreement.", [
    f("owner", "text", "বাড়িওয়ালা / Owner", { required: true }),
    f("tenant", "text", "ভাড়াটিয়া / Tenant", { required: true }),
    f("nid_owner", "text", "NID (owner)", { required: true }),
    f("nid_tenant", "text", "NID (tenant)", { required: true }),
    f("address", "textarea", "Address", { required: true }),
    f("rent", "number", "Monthly rent (BDT)", { required: true }),
    f("start", "date", "Start date", { required: true }),
    f("owner_sign", "signature", "Owner signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),

  /* ── Nigeria ── */
  tpl("ng-tenancy", "Tenancy Agreement", "ng", "Nigeria", "Housing", "en", "Tenancy Agreement", "Nigeria rental agreement.", [
    f("landlord", "text", "Landlord", { required: true }),
    f("tenant", "text", "Tenant", { required: true }),
    f("nin", "text", "NIN", { required: true }),
    f("property", "textarea", "Property address", { required: true }),
    f("rent", "number", "Annual rent (NGN)", { required: true }),
    f("start", "date", "Commencement date", { required: true }),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),

  /* ── Canada / Australia (compact) ── */
  tpl("ca-lease", "Residential Lease", "ca", "Canada", "Housing", "en", "Residential Lease", "Canadian rental lease.", [
    f("landlord", "text", "Landlord", { required: true }),
    f("tenant", "text", "Tenant", { required: true }),
    f("address", "textarea", "Rental unit address", { required: true }),
    f("rent", "number", "Monthly rent (CAD)", { required: true }),
    f("start", "date", "Lease start", { required: true }),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),
  tpl("au-lease", "Residential Tenancy", "au", "Australia", "Housing", "en", "Residential Tenancy Agreement", "Australian rental agreement.", [
    f("landlord", "text", "Landlord / agent", { required: true }),
    f("tenant", "text", "Tenant", { required: true }),
    f("address", "textarea", "Premises address", { required: true }),
    f("rent", "number", "Weekly rent (AUD)", { required: true }),
    f("bond", "number", "Bond amount"),
    f("start", "date", "Start date", { required: true }),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),

  /* ── Indonesia / Malaysia / Philippines ── */
  tpl("id-sewa", "Perjanjian Sewa", "id", "Indonesia", "Housing", "id", "Perjanjian Sewa", "Kontrak sewa rumah.", [
    f("pemilik", "text", "Pemilik", { required: true }),
    f("penyewa", "text", "Penyewa", { required: true }),
    f("ktp", "text", "NIK / KTP", { required: true }),
    f("alamat", "textarea", "Alamat properti", { required: true }),
    f("sewa", "number", "Sewa bulanan (IDR)", { required: true }),
    f("mulai", "date", "Tanggal mulai", { required: true }),
    f("ttd_pemilik", "signature", "Tanda tangan pemilik", { required: true }),
    f("ttd_penyewa", "signature", "Tanda tangan penyewa", { required: true }),
  ]),
  tpl("my-tenancy", "Tenancy Agreement", "my", "Malaysia", "Housing", "en", "Tenancy Agreement", "Malaysia rental agreement.", [
    f("landlord", "text", "Landlord", { required: true }),
    f("tenant", "text", "Tenant", { required: true }),
    f("ic", "text", "IC / Passport no.", { required: true }),
    f("address", "textarea", "Property address", { required: true }),
    f("rent", "number", "Monthly rent (MYR)", { required: true }),
    f("start", "date", "Start date", { required: true }),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),
  tpl("ph-rent", "Rent Agreement", "ph", "Philippines", "Housing", "en", "Rent Agreement", "Philippines rental contract.", [
    f("lessor", "text", "Lessor", { required: true }),
    f("lessee", "text", "Lessee", { required: true }),
    f("address", "textarea", "Property address", { required: true }),
    f("rent", "number", "Monthly rent (PHP)", { required: true }),
    f("start", "date", "Start date", { required: true }),
    f("lessor_sign", "signature", "Lessor signature", { required: true }),
    f("lessee_sign", "signature", "Lessee signature", { required: true }),
  ]),

  /* ── Egypt / South Africa / Mexico / Japan / Korea / Italy / NL / PL / RU ── */
  tpl("eg-rent", "عقد إيجار", "eg", "Egypt", "Housing", "ar", "عقد إيجار", "Residential lease Egypt.", [
    f("owner", "text", "المالك", { required: true }),
    f("tenant", "text", "المستأجر", { required: true }),
    f("national_id", "text", "الرقم القومي", { required: true }),
    f("address", "textarea", "عنوان العقار", { required: true }),
    f("rent", "number", "الإيجار (EGP)", { required: true }),
    f("start", "date", "تاريخ البداية", { required: true }),
    f("owner_sign", "signature", "توقيع المالك", { required: true }),
    f("tenant_sign", "signature", "توقيع المستأجر", { required: true }),
  ]),
  tpl("za-lease", "Lease Agreement", "za", "South Africa", "Housing", "en", "Lease Agreement", "South Africa rental.", [
    f("landlord", "text", "Landlord", { required: true }),
    f("tenant", "text", "Tenant", { required: true }),
    f("id_number", "text", "ID number", { required: true }),
    f("address", "textarea", "Property address", { required: true }),
    f("rent", "number", "Monthly rent (ZAR)", { required: true }),
    f("start", "date", "Start date", { required: true }),
    f("landlord_sign", "signature", "Landlord signature", { required: true }),
    f("tenant_sign", "signature", "Tenant signature", { required: true }),
  ]),
  tpl("mx-arrendamiento", "Contrato de arrendamiento", "mx", "Mexico", "Housing", "es", "Contrato de arrendamiento", "Contrato de renta México.", [
    f("arrendador", "text", "Arrendador", { required: true }),
    f("arrendatario", "text", "Arrendatario", { required: true }),
    f("rfc", "text", "RFC", { required: true }),
    f("direccion", "textarea", "Dirección", { required: true }),
    f("renta", "number", "Renta mensual (MXN)", { required: true }),
    f("inicio", "date", "Fecha inicio", { required: true }),
    f("firma_arrendador", "signature", "Firma arrendador", { required: true }),
    f("firma_arrendatario", "signature", "Firma arrendatario", { required: true }),
  ]),
  tpl("jp-employment", "雇用契約書", "jp", "Japan", "Employment", "ja", "雇用契約書", "Employment contract info.", [
    f("employer", "text", "雇用主", { required: true }),
    f("employee", "text", "従業員名", { required: true }),
    f("job", "text", "職種", { required: true }),
    f("salary", "number", "給与 (JPY)", { required: true }),
    f("start", "date", "開始日", { required: true }),
    f("employer_sign", "signature", "雇用主署名", { required: true }),
    f("employee_sign", "signature", "従業員署名", { required: true }),
  ]),
  tpl("kr-employment", "근로계약서", "kr", "South Korea", "Employment", "ko", "근로계약서", "Employment contract.", [
    f("employer", "text", "사용자", { required: true }),
    f("employee", "text", "근로자", { required: true }),
    f("job", "text", "직무", { required: true }),
    f("salary", "number", "급여 (KRW)", { required: true }),
    f("start", "date", "시작일", { required: true }),
    f("employer_sign", "signature", "사용자 서명", { required: true }),
    f("employee_sign", "signature", "근로자 서명", { required: true }),
  ]),
  tpl("it-lavoro", "Domanda di lavoro", "it", "Italy", "Employment", "it", "Domanda di lavoro", "Candidatura lavoro.", [
    f("nome", "text", "Nome completo", { required: true }),
    f("email", "email", "Email", { required: true }),
    f("telefono", "phone", "Telefono", { required: true }),
    f("codice_fiscale", "text", "Codice fiscale"),
    f("esperienza", "textarea", "Esperienza"),
    f("firma", "signature", "Firma", { required: true }),
  ]),
  tpl("nl-huur", "Huurcontract", "nl", "Netherlands", "Housing", "nl", "Huurcontract", "Huurovereenkomst woning.", [
    f("verhuurder", "text", "Verhuurder", { required: true }),
    f("huurder", "text", "Huurder", { required: true }),
    f("adres", "textarea", "Adres woning", { required: true }),
    f("huur", "number", "Maandhuur (EUR)", { required: true }),
    f("start", "date", "Ingangsdatum", { required: true }),
    f("verhuurder_sign", "signature", "Handtekening verhuurder", { required: true }),
    f("huurder_sign", "signature", "Handtekening huurder", { required: true }),
  ]),
  tpl("pl-najem", "Umowa najmu", "pl", "Poland", "Housing", "pl", "Umowa najmu", "Umowa najmu mieszkania.", [
    f("wynajmujacy", "text", "Wynajmujący", { required: true }),
    f("najemca", "text", "Najemca", { required: true }),
    f("pesel", "text", "PESEL", { required: true }),
    f("adres", "textarea", "Adres nieruchomości", { required: true }),
    f("czynsz", "number", "Czynsz (PLN)", { required: true }),
    f("start", "date", "Data rozpoczęcia", { required: true }),
    f("wynajmujacy_sign", "signature", "Podpis wynajmującego", { required: true }),
    f("najemca_sign", "signature", "Podpis najemcy", { required: true }),
  ]),
  tpl("ru-lease", "Договор аренды", "ru", "Russia", "Housing", "ru", "Договор аренды", "Договор аренды жилья.", [
    f("landlord", "text", "Арендодатель", { required: true }),
    f("tenant", "text", "Арендатор", { required: true }),
    f("passport", "text", "Паспортные данные", { required: true }),
    f("address", "textarea", "Адрес объекта", { required: true }),
    f("rent", "number", "Аренда (RUB)", { required: true }),
    f("start", "date", "Дата начала", { required: true }),
    f("landlord_sign", "signature", "Подпись арендодателя", { required: true }),
    f("tenant_sign", "signature", "Подпись арендатора", { required: true }),
  ]),
];

/** @deprecated Use MANUAL_TEMPLATES — kept for backwards compatibility. */
export const FORM_TEMPLATES = MANUAL_TEMPLATES;

export { FORM_CATEGORIES };

const manualIds = new Set(MANUAL_TEMPLATES.map((t) => t.id));

function dedupeGenerated(list: FormTemplate[]): FormTemplate[] {
  return list.filter((t) => !manualIds.has(t.id));
}

function templatesForCountryCode(countryCode: string): FormTemplate[] {
  if (countryCode === "global") {
    return [...MANUAL_TEMPLATES.filter((t) => t.country === "global"), ...getGlobalGeneratedTemplates()];
  }
  if (countryCode === "all") {
    return [
      ...MANUAL_TEMPLATES.filter((t) => t.country === "global"),
      ...getGlobalGeneratedTemplates(),
    ];
  }
  const countryManual = MANUAL_TEMPLATES.filter((t) => t.country === countryCode);
  const globalManual = MANUAL_TEMPLATES.filter((t) => t.country === "global");
  const generated = dedupeGenerated([
    ...getGlobalGeneratedTemplates(),
    ...getGeneratedForCountry(countryCode),
  ]);
  return [...globalManual, ...countryManual, ...generated];
}

let fullCatalog: FormTemplate[] | null = null;

function getFullCatalog(): FormTemplate[] {
  if (!fullCatalog) {
    fullCatalog = [
      ...MANUAL_TEMPLATES,
      ...dedupeGenerated(getAllGeneratedTemplates()),
    ];
  }
  return fullCatalog;
}

export function getTemplate(id: string): FormTemplate | undefined {
  return getFullCatalog().find((t) => t.id === id);
}

/** Templates for country + optional search and category filter. */
export function templatesForCountry(
  countryCode: string,
  query = "",
  category = "All categories",
): FormTemplate[] {
  const q = query.trim().toLowerCase();
  const base =
    countryCode === "all" && q.length >= 2 ? getFullCatalog() : templatesForCountryCode(countryCode);

  return base
    .filter((t) => {
      if (category !== "All categories" && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.schema.title.toLowerCase().includes(q) ||
        t.countryLabel.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.country === b.country) return a.name.localeCompare(b.name);
      if (a.country === "global") return -1;
      if (b.country === "global") return 1;
      return a.countryLabel.localeCompare(b.countryLabel);
    });
}

export function templateToSchema(
  template: FormTemplate,
  languageOverride?: string,
  existingBranding?: FormSchema["branding"],
): FormSchema {
  return {
    ...template.schema,
    language: languageOverride ?? template.schema.language,
    fields: template.schema.fields.map((field) => ({ ...field })),
    branding: mergeBranding(existingBranding),
  };
}

export function templateCount(): number {
  return MANUAL_TEMPLATES.length + dedupeGenerated(getAllGeneratedTemplates()).length;
}

export function approximateTemplateCount(): string {
  const n = templateCount();
  if (n >= 1000) return `${Math.floor(n / 100) * 100}+`;
  return `${n}+`;
}
