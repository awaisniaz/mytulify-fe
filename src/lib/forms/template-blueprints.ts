import type { FormField } from "./schema";

export type BlueprintId =
  | "rent"
  | "job"
  | "employment_contract"
  | "school_admission"
  | "college_application"
  | "medical_intake"
  | "dental_intake"
  | "invoice"
  | "tax_invoice"
  | "quotation"
  | "purchase_order"
  | "delivery_note"
  | "receipt"
  | "proforma_invoice"
  | "expense_claim"
  | "leave"
  | "timesheet"
  | "resignation"
  | "offer_letter"
  | "internship"
  | "volunteer"
  | "donation"
  | "membership"
  | "event_registration"
  | "hotel_booking"
  | "travel_request"
  | "visa_support"
  | "driving_license"
  | "vehicle_sale"
  | "vehicle_purchase"
  | "insurance_claim"
  | "insurance_application"
  | "loan_application"
  | "bank_account"
  | "kyc_form"
  | "power_of_attorney"
  | "affidavit"
  | "marriage_registration"
  | "complaint"
  | "grievance"
  | "feedback"
  | "consent_medical"
  | "consent_general"
  | "nda"
  | "partnership"
  | "vendor_registration"
  | "client_onboarding"
  | "supplier_registration"
  | "maintenance_request"
  | "it_support"
  | "asset_handover"
  | "exit_interview"
  | "reference_check"
  | "tenant_application"
  | "property_inspection"
  | "utility_connection"
  | "scholarship"
  | "refund_request"
  | "warranty_claim"
  | "gym_membership"
  | "parking_permit"
  | "contractor_agreement"
  | "freelance_agreement"
  | "domestic_worker"
  | "police_verification"
  | "character_certificate"
  | "trade_license"
  | "import_export"
  | "shipping_form"
  | "customs_declaration"
  | "credit_application"
  | "warehouse_receipt"
  | "performance_review"
  | "background_check"
  | "will_declaration"
  | "birth_registration"
  | "death_certificate"
  | "divorce_petition"
  | "rent_increase"
  | "lease_termination"
  | "stock_transfer"
  | "shareholder_register"
  | "board_resolution"
  | "meeting_minutes"
  | "sick_leave"
  | "maternity_leave"
  | "overtime_claim"
  | "travel_expense"
  | "pet_adoption"
  | "child_care"
  | "parent_consent"
  | "field_trip"
  | "blood_donation"
  | "organ_donor"
  | "covid_declaration"
  | "food_order"
  | "catering_request"
  | "wedding_booking"
  | "funeral_service"
  | "real_estate_listing"
  | "tenant_reference"
  | "landlord_reference"
  | "sublease"
  | "room_rental"
  | "commercial_lease"
  | "office_lease"
  | "equipment_lease"
  | "construction_permit_info"
  | "building_inspection"
  | "zoning_application"
  | "freedom_of_information"
  | "rti_application"
  | "foia_request"
  | "passport_renewal"
  | "national_id"
  | "voter_registration"
  | "tax_exemption"
  | "charity_registration"
  | "grant_application"
  | "project_proposal"
  | "bid_submission"
  | "tender_application"
  | "quality_inspection"
  | "return_merchandise"
  | "change_of_address"
  | "name_change"
  | "salary_certificate"
  | "experience_letter"
  | "bonafide_certificate"
  | "no_objection_certificate"
  | "salary_transfer"
  | "bank_guarantee"
  | "letter_of_credit"
  | "promissory_note"
  | "loan_guarantor"
  | "rental_bond"
  | "deposit_refund"
  | "inventory_count"
  | "stock_request"
  | "material_requisition";

function fld(id: string, type: FormField["type"], label: string, extra?: Partial<FormField>): FormField {
  return { id, type, label, required: extra?.required ?? false, ...extra };
}

const sig = (id: string, label = "Signature") => fld(id, "signature", label, { required: true });
const idField = (label = "ID number") => fld("id_number", "text", label, { required: true });

/** English field sets — used for generated catalog entries worldwide. */
export const BLUEPRINT_FIELDS: Record<BlueprintId, FormField[]> = {
  rent: [
    fld("landlord", "text", "Landlord / lessor name", { required: true }),
    idField("Landlord ID"),
    fld("tenant", "text", "Tenant name", { required: true }),
    idField("Tenant ID"),
    fld("property", "textarea", "Property address", { required: true }),
    fld("rent", "number", "Rent amount", { required: true }),
    fld("deposit", "number", "Security deposit"),
    fld("start", "date", "Start date", { required: true }),
    fld("end", "date", "End date"),
    sig("landlord_sign", "Landlord signature"),
    sig("tenant_sign", "Tenant signature"),
  ],
  job: [
    fld("name", "text", "Full name", { required: true }),
    fld("email", "email", "Email", { required: true }),
    fld("phone", "phone", "Phone", { required: true }),
    idField("National ID"),
    fld("address", "textarea", "Address", { required: true }),
    fld("education", "textarea", "Education"),
    fld("experience", "textarea", "Work experience"),
    fld("expected_salary", "number", "Expected salary"),
    sig("applicant_sign"),
  ],
  employment_contract: [
    fld("employer", "text", "Employer", { required: true }),
    fld("employee", "text", "Employee", { required: true }),
    fld("job_title", "text", "Job title", { required: true }),
    fld("department", "text", "Department"),
    fld("salary", "number", "Salary", { required: true }),
    fld("start", "date", "Start date", { required: true }),
    fld("probation", "text", "Probation period"),
    sig("employer_sign", "Employer signature"),
    sig("employee_sign", "Employee signature"),
  ],
  school_admission: [
    fld("student", "text", "Student name", { required: true }),
    fld("dob", "date", "Date of birth", { required: true }),
    fld("grade", "select", "Grade / class", { options: ["Pre-K", "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] }),
    fld("parent", "text", "Parent / guardian", { required: true }),
    idField("Parent ID"),
    fld("phone", "phone", "Contact phone", { required: true }),
    fld("address", "textarea", "Address", { required: true }),
    fld("previous_school", "text", "Previous school"),
    sig("parent_sign", "Parent signature"),
  ],
  college_application: [
    fld("name", "text", "Applicant name", { required: true }),
    fld("dob", "date", "Date of birth", { required: true }),
    fld("program", "text", "Program / major", { required: true }),
    fld("email", "email", "Email", { required: true }),
    fld("gpa", "text", "GPA / grades"),
    fld("statement", "textarea", "Personal statement"),
    sig("applicant_sign"),
  ],
  medical_intake: [
    fld("patient", "text", "Patient name", { required: true }),
    fld("dob", "date", "Date of birth", { required: true }),
    fld("gender", "radio", "Gender", { options: ["Male", "Female", "Other"] }),
    fld("allergies", "textarea", "Allergies"),
    fld("medications", "textarea", "Current medications"),
    fld("history", "textarea", "Medical history"),
    fld("emergency", "text", "Emergency contact", { required: true }),
    fld("consent", "checkbox", "Treatment consent", { required: true }),
  ],
  dental_intake: [
    fld("patient", "text", "Patient name", { required: true }),
    fld("dob", "date", "Date of birth"),
    fld("last_visit", "date", "Last dental visit"),
    fld("concerns", "textarea", "Dental concerns"),
    fld("insurance", "text", "Insurance provider"),
    sig("patient_sign"),
  ],
  invoice: [
    fld("invoice_no", "text", "Invoice #", { required: true }),
    fld("date", "date", "Date", { required: true }),
    fld("seller", "textarea", "From (seller)", { required: true }),
    fld("buyer", "textarea", "Bill to", { required: true }),
    fld("items", "textarea", "Items & amounts", { required: true }),
    fld("total", "number", "Total", { required: true }),
    fld("due", "date", "Due date"),
  ],
  tax_invoice: [
    fld("tax_invoice_no", "text", "Tax invoice #", { required: true }),
    fld("seller_gst", "text", "Seller tax ID", { required: true }),
    fld("buyer_gst", "text", "Buyer tax ID"),
    fld("date", "date", "Date", { required: true }),
    fld("items", "textarea", "Line items (HSN, qty, tax)", { required: true }),
    fld("tax", "number", "Tax amount"),
    fld("total", "number", "Grand total", { required: true }),
  ],
  quotation: [
    fld("quote_no", "text", "Quote #", { required: true }),
    fld("date", "date", "Date", { required: true }),
    fld("client", "textarea", "Client", { required: true }),
    fld("scope", "textarea", "Scope / items", { required: true }),
    fld("valid_until", "date", "Valid until"),
    fld("total", "number", "Quoted amount"),
  ],
  purchase_order: [
    fld("po_no", "text", "PO number", { required: true }),
    fld("vendor", "text", "Vendor", { required: true }),
    fld("date", "date", "Order date", { required: true }),
    fld("items", "textarea", "Items ordered", { required: true }),
    fld("delivery", "date", "Delivery date"),
    fld("total", "number", "Total"),
    sig("authorized_sign", "Authorized signature"),
  ],
  delivery_note: [
    fld("dn_no", "text", "Delivery note #", { required: true }),
    fld("date", "date", "Date", { required: true }),
    fld("recipient", "text", "Recipient", { required: true }),
    fld("items", "textarea", "Items delivered", { required: true }),
    sig("receiver_sign", "Receiver signature"),
  ],
  receipt: [
    fld("receipt_no", "text", "Receipt #", { required: true }),
    fld("date", "date", "Date", { required: true }),
    fld("received_from", "text", "Received from", { required: true }),
    fld("amount", "number", "Amount", { required: true }),
    fld("for", "text", "Payment for", { required: true }),
    fld("method", "select", "Payment method", { options: ["Cash", "Card", "Bank transfer", "Cheque"] }),
  ],
  proforma_invoice: [
    fld("proforma_no", "text", "Proforma #", { required: true }),
    fld("date", "date", "Date"),
    fld("buyer", "textarea", "Buyer"),
    fld("items", "textarea", "Items", { required: true }),
    fld("total", "number", "Total"),
  ],
  expense_claim: [
    fld("employee", "text", "Employee name", { required: true }),
    fld("department", "text", "Department"),
    fld("items", "textarea", "Expenses (date, description, amount)", { required: true }),
    fld("total", "number", "Total claim"),
    sig("employee_sign"),
    sig("manager_sign", "Manager approval"),
  ],
  leave: [
    fld("employee", "text", "Employee name", { required: true }),
    fld("leave_type", "select", "Leave type", { options: ["Annual", "Sick", "Unpaid", "Maternity", "Other"] }),
    fld("from", "date", "From", { required: true }),
    fld("to", "date", "To", { required: true }),
    fld("reason", "textarea", "Reason"),
    sig("employee_sign"),
  ],
  timesheet: [
    fld("employee", "text", "Employee", { required: true }),
    fld("week", "text", "Week ending", { required: true }),
    fld("hours", "textarea", "Hours by day / project", { required: true }),
    fld("total_hours", "number", "Total hours"),
    sig("employee_sign"),
  ],
  resignation: [
    fld("employee", "text", "Employee name", { required: true }),
    fld("position", "text", "Position"),
    fld("last_day", "date", "Last working day", { required: true }),
    fld("reason", "textarea", "Reason (optional)"),
    sig("employee_sign"),
  ],
  offer_letter: [
    fld("candidate", "text", "Candidate name", { required: true }),
    fld("position", "text", "Position", { required: true }),
    fld("salary", "number", "Salary offered"),
    fld("start", "date", "Start date"),
    fld("terms", "textarea", "Terms"),
    sig("employer_sign", "Employer signature"),
  ],
  internship: [
    fld("student", "text", "Student name", { required: true }),
    fld("institution", "text", "Institution", { required: true }),
    fld("department", "text", "Department"),
    fld("duration", "text", "Duration"),
    sig("student_sign"),
    sig("supervisor_sign", "Supervisor signature"),
  ],
  volunteer: [
    fld("name", "text", "Name", { required: true }),
    fld("email", "email", "Email"),
    fld("phone", "phone", "Phone", { required: true }),
    fld("skills", "textarea", "Skills"),
    sig("volunteer_sign"),
  ],
  donation: [
    fld("donor", "text", "Donor name", { required: true }),
    fld("amount", "number", "Amount", { required: true }),
    fld("purpose", "text", "Purpose"),
    fld("anonymous", "checkbox", "Donate anonymously"),
    sig("donor_sign"),
  ],
  membership: [
    fld("name", "text", "Full name", { required: true }),
    fld("email", "email", "Email", { required: true }),
    fld("type", "select", "Membership type", { options: ["Individual", "Family", "Corporate"] }),
    fld("address", "textarea", "Address"),
    sig("member_sign"),
  ],
  event_registration: [
    fld("name", "text", "Name", { required: true }),
    fld("email", "email", "Email", { required: true }),
    fld("ticket", "select", "Ticket", { options: ["Standard", "VIP", "Student"] }),
    fld("dietary", "text", "Dietary needs"),
  ],
  hotel_booking: [
    fld("guest", "text", "Guest name", { required: true }),
    fld("check_in", "date", "Check-in", { required: true }),
    fld("check_out", "date", "Check-out", { required: true }),
    fld("room", "select", "Room type", { options: ["Single", "Double", "Suite"] }),
    fld("guests", "number", "Number of guests"),
  ],
  travel_request: [
    fld("employee", "text", "Traveler", { required: true }),
    fld("destination", "text", "Destination", { required: true }),
    fld("from", "date", "Departure", { required: true }),
    fld("to", "date", "Return"),
    fld("purpose", "textarea", "Purpose"),
    sig("approver_sign", "Approver signature"),
  ],
  visa_support: [
    fld("applicant", "text", "Applicant name", { required: true }),
    fld("passport", "text", "Passport number", { required: true }),
    fld("nationality", "text", "Nationality"),
    fld("destination", "text", "Destination country", { required: true }),
    fld("travel_dates", "text", "Travel dates"),
    fld("sponsor", "textarea", "Sponsor details"),
  ],
  driving_license: [
    fld("name", "text", "Full name", { required: true }),
    fld("dob", "date", "Date of birth", { required: true }),
    fld("address", "textarea", "Address", { required: true }),
    fld("license_class", "select", "License class", { options: ["A", "B", "C", "D", "Motorcycle"] }),
    idField("National ID"),
  ],
  vehicle_sale: [
    fld("seller", "text", "Seller", { required: true }),
    idField("Seller ID"),
    fld("buyer", "text", "Buyer", { required: true }),
    idField("Buyer ID"),
    fld("vehicle", "text", "Vehicle (make, model, reg #)", { required: true }),
    fld("price", "number", "Sale price", { required: true }),
    fld("date", "date", "Date", { required: true }),
    sig("seller_sign"),
    sig("buyer_sign"),
  ],
  vehicle_purchase: [
    fld("buyer", "text", "Buyer", { required: true }),
    fld("dealer", "text", "Seller / dealer", { required: true }),
    fld("vehicle", "text", "Vehicle details", { required: true }),
    fld("vin", "text", "VIN / chassis #"),
    fld("price", "number", "Purchase price", { required: true }),
    sig("buyer_sign"),
  ],
  insurance_claim: [
    fld("policyholder", "text", "Policyholder", { required: true }),
    fld("policy_no", "text", "Policy number", { required: true }),
    fld("incident_date", "date", "Incident date", { required: true }),
    fld("description", "textarea", "Incident description", { required: true }),
    fld("amount", "number", "Claim amount"),
  ],
  insurance_application: [
    fld("applicant", "text", "Applicant name", { required: true }),
    fld("dob", "date", "Date of birth"),
    fld("coverage", "select", "Coverage type", { options: ["Health", "Life", "Auto", "Home", "Travel"] }),
    fld("beneficiary", "text", "Beneficiary"),
    sig("applicant_sign"),
  ],
  loan_application: [
    fld("applicant", "text", "Applicant name", { required: true }),
    idField("National ID"),
    fld("amount", "number", "Loan amount", { required: true }),
    fld("purpose", "textarea", "Purpose", { required: true }),
    fld("income", "number", "Monthly income"),
    fld("employment", "text", "Employer"),
    sig("applicant_sign"),
  ],
  bank_account: [
    fld("name", "text", "Account holder name", { required: true }),
    idField("National ID"),
    fld("address", "textarea", "Address", { required: true }),
    fld("phone", "phone", "Phone", { required: true }),
    fld("account_type", "select", "Account type", { options: ["Savings", "Current", "Business"] }),
    sig("applicant_sign"),
  ],
  kyc_form: [
    fld("name", "text", "Full legal name", { required: true }),
    fld("dob", "date", "Date of birth", { required: true }),
    idField("ID / passport number"),
    fld("address", "textarea", "Residential address", { required: true }),
    fld("occupation", "text", "Occupation"),
    fld("source_of_funds", "text", "Source of funds"),
    sig("applicant_sign"),
  ],
  power_of_attorney: [
    fld("principal", "text", "Principal (grantor)", { required: true }),
    fld("agent", "text", "Agent (attorney-in-fact)", { required: true }),
    fld("powers", "textarea", "Powers granted", { required: true }),
    fld("effective", "date", "Effective date"),
    sig("principal_sign"),
    sig("witness_sign", "Witness signature"),
  ],
  affidavit: [
    fld("deponent", "text", "Deponent name", { required: true }),
    idField("ID number"),
    fld("address", "textarea", "Address", { required: true }),
    fld("statement", "textarea", "Statement of truth", { required: true }),
    fld("place", "text", "Place"),
    fld("date", "date", "Date", { required: true }),
    sig("deponent_sign"),
  ],
  marriage_registration: [
    fld("party_a", "text", "Party A name", { required: true }),
    fld("party_b", "text", "Party B name", { required: true }),
    fld("date", "date", "Marriage date"),
    fld("venue", "text", "Venue"),
    fld("witness_1", "text", "Witness 1"),
    fld("witness_2", "text", "Witness 2"),
    sig("party_a_sign"),
    sig("party_b_sign"),
  ],
  complaint: [
    fld("complainant", "text", "Your name", { required: true }),
    fld("contact", "text", "Contact info", { required: true }),
    fld("against", "text", "Against (person / org)"),
    fld("details", "textarea", "Complaint details", { required: true }),
    fld("date", "date", "Date"),
  ],
  grievance: [
    fld("employee", "text", "Employee name", { required: true }),
    fld("department", "text", "Department"),
    fld("grievance", "textarea", "Grievance description", { required: true }),
    fld("resolution", "textarea", "Desired resolution"),
    sig("employee_sign"),
  ],
  feedback: [
    fld("name", "text", "Name"),
    fld("rating", "radio", "Rating", { options: ["Excellent", "Good", "Average", "Poor"] }),
    fld("comments", "textarea", "Comments"),
  ],
  consent_medical: [
    fld("patient", "text", "Patient name", { required: true }),
    fld("procedure", "text", "Procedure / treatment", { required: true }),
    fld("risks", "textarea", "Risks explained"),
    fld("consent", "checkbox", "I consent to treatment", { required: true }),
    sig("patient_sign"),
    sig("guardian_sign", "Guardian signature (if minor)"),
  ],
  consent_general: [
    fld("name", "text", "Name", { required: true }),
    fld("purpose", "textarea", "Purpose of consent", { required: true }),
    fld("agree", "checkbox", "I agree", { required: true }),
    sig("sign"),
  ],
  nda: [
    fld("party_a", "text", "Party A", { required: true }),
    fld("party_b", "text", "Party B", { required: true }),
    fld("purpose", "textarea", "Purpose", { required: true }),
    fld("term", "text", "Confidentiality term"),
    sig("party_a_sign"),
    sig("party_b_sign"),
  ],
  partnership: [
    fld("partner_1", "text", "Partner 1", { required: true }),
    fld("partner_2", "text", "Partner 2", { required: true }),
    fld("business", "text", "Business name", { required: true }),
    fld("share", "text", "Profit sharing ratio"),
    fld("capital", "textarea", "Capital contribution"),
    sig("partner_1_sign"),
    sig("partner_2_sign"),
  ],
  vendor_registration: [
    fld("company", "text", "Company name", { required: true }),
    fld("tax_id", "text", "Tax ID"),
    fld("contact", "text", "Contact person", { required: true }),
    fld("email", "email", "Email", { required: true }),
    fld("bank", "textarea", "Bank details"),
  ],
  client_onboarding: [
    fld("client", "text", "Client name", { required: true }),
    fld("contact", "text", "Primary contact", { required: true }),
    fld("email", "email", "Email", { required: true }),
    fld("services", "textarea", "Services required"),
    fld("billing", "text", "Billing address"),
  ],
  supplier_registration: [
    fld("supplier", "text", "Supplier name", { required: true }),
    fld("products", "textarea", "Products / services"),
    fld("contact", "text", "Contact", { required: true }),
    fld("payment_terms", "text", "Payment terms"),
  ],
  maintenance_request: [
    fld("requester", "text", "Requester", { required: true }),
    fld("location", "text", "Location / asset", { required: true }),
    fld("issue", "textarea", "Issue description", { required: true }),
    fld("priority", "select", "Priority", { options: ["Low", "Medium", "High", "Urgent"] }),
  ],
  it_support: [
    fld("user", "text", "User name", { required: true }),
    fld("department", "text", "Department"),
    fld("issue", "textarea", "Issue", { required: true }),
    fld("device", "text", "Device / system"),
  ],
  asset_handover: [
    fld("from", "text", "Handed from", { required: true }),
    fld("to", "text", "Handed to", { required: true }),
    fld("assets", "textarea", "Assets list", { required: true }),
    fld("date", "date", "Date", { required: true }),
    sig("from_sign"),
    sig("to_sign"),
  ],
  exit_interview: [
    fld("employee", "text", "Employee", { required: true }),
    fld("reason", "textarea", "Reason for leaving"),
    fld("feedback", "textarea", "Feedback for organization"),
    fld("rehire", "radio", "Eligible for rehire?", { options: ["Yes", "No"] }),
  ],
  reference_check: [
    fld("candidate", "text", "Candidate name", { required: true }),
    fld("referee", "text", "Referee name", { required: true }),
    fld("relationship", "text", "Relationship"),
    fld("performance", "textarea", "Performance assessment"),
    sig("referee_sign"),
  ],
  tenant_application: [
    fld("applicant", "text", "Applicant name", { required: true }),
    idField("ID number"),
    fld("current_address", "textarea", "Current address"),
    fld("employer", "text", "Employer"),
    fld("income", "number", "Monthly income"),
    fld("references", "textarea", "References"),
    sig("applicant_sign"),
  ],
  property_inspection: [
    fld("property", "textarea", "Property address", { required: true }),
    fld("inspector", "text", "Inspector", { required: true }),
    fld("date", "date", "Inspection date", { required: true }),
    fld("findings", "textarea", "Findings", { required: true }),
    fld("photos_note", "text", "Photos attached?"),
  ],
  utility_connection: [
    fld("applicant", "text", "Applicant name", { required: true }),
    fld("address", "textarea", "Connection address", { required: true }),
    fld("utility", "select", "Utility", { options: ["Electricity", "Gas", "Water", "Internet"] }),
    idField("ID number"),
  ],
  scholarship: [
    fld("student", "text", "Student name", { required: true }),
    fld("institution", "text", "Institution", { required: true }),
    fld("program", "text", "Program"),
    fld("essay", "textarea", "Statement / essay"),
    fld("financial_need", "textarea", "Financial need"),
  ],
  refund_request: [
    fld("customer", "text", "Customer name", { required: true }),
    fld("order", "text", "Order / invoice #", { required: true }),
    fld("amount", "number", "Refund amount"),
    fld("reason", "textarea", "Reason", { required: true }),
  ],
  warranty_claim: [
    fld("customer", "text", "Customer", { required: true }),
    fld("product", "text", "Product", { required: true }),
    fld("serial", "text", "Serial number"),
    fld("purchase_date", "date", "Purchase date"),
    fld("issue", "textarea", "Defect description", { required: true }),
  ],
  gym_membership: [
    fld("member", "text", "Member name", { required: true }),
    fld("plan", "select", "Plan", { options: ["Monthly", "Quarterly", "Annual"] }),
    fld("emergency", "text", "Emergency contact"),
    fld("health", "textarea", "Health conditions"),
    sig("member_sign"),
  ],
  parking_permit: [
    fld("name", "text", "Name", { required: true }),
    fld("vehicle", "text", "Vehicle registration", { required: true }),
    fld("permit_type", "select", "Permit type", { options: ["Resident", "Visitor", "Staff"] }),
  ],
  contractor_agreement: [
    fld("client", "text", "Client", { required: true }),
    fld("contractor", "text", "Contractor", { required: true }),
    fld("scope", "textarea", "Scope of work", { required: true }),
    fld("fee", "number", "Contract fee"),
    fld("timeline", "text", "Timeline"),
    sig("client_sign"),
    sig("contractor_sign"),
  ],
  freelance_agreement: [
    fld("client", "text", "Client", { required: true }),
    fld("freelancer", "text", "Freelancer", { required: true }),
    fld("deliverables", "textarea", "Deliverables", { required: true }),
    fld("payment", "text", "Payment terms"),
    sig("client_sign"),
    sig("freelancer_sign"),
  ],
  domestic_worker: [
    fld("employer", "text", "Employer", { required: true }),
    fld("worker", "text", "Worker name", { required: true }),
    fld("passport", "text", "Passport / ID", { required: true }),
    fld("duties", "textarea", "Duties"),
    fld("salary", "number", "Salary"),
    fld("start", "date", "Start date"),
    sig("employer_sign"),
    sig("worker_sign"),
  ],
  police_verification: [
    fld("name", "text", "Applicant name", { required: true }),
    idField("National ID"),
    fld("father", "text", "Father name"),
    fld("address", "textarea", "Permanent address", { required: true }),
    fld("purpose", "text", "Purpose", { required: true }),
  ],
  character_certificate: [
    fld("name", "text", "Applicant name", { required: true }),
    idField("ID number"),
    fld("address", "textarea", "Address"),
    fld("purpose", "text", "Purpose", { required: true }),
    sig("applicant_sign"),
  ],
  trade_license: [
    fld("business", "text", "Business name", { required: true }),
    fld("owner", "text", "Owner name", { required: true }),
    idField("Owner ID"),
    fld("activity", "textarea", "Business activity", { required: true }),
    fld("address", "textarea", "Business address", { required: true }),
  ],
  import_export: [
    fld("company", "text", "Company name", { required: true }),
    fld("license_no", "text", "License number"),
    fld("goods", "textarea", "Goods description", { required: true }),
    fld("origin", "text", "Country of origin"),
    fld("destination", "text", "Destination"),
  ],
  shipping_form: [
    fld("shipper", "textarea", "Shipper", { required: true }),
    fld("consignee", "textarea", "Consignee", { required: true }),
    fld("goods", "textarea", "Description of goods", { required: true }),
    fld("weight", "text", "Weight"),
    fld("value", "number", "Declared value"),
  ],
  customs_declaration: [
    fld("declarant", "text", "Declarant", { required: true }),
    fld("passport", "text", "Passport / ID"),
    fld("items", "textarea", "Items declared", { required: true }),
    fld("value", "number", "Total value"),
  ],
  credit_application: [
    fld("business", "text", "Business name", { required: true }),
    fld("contact", "text", "Contact", { required: true }),
    fld("credit_limit", "number", "Credit limit requested"),
    fld("trade_refs", "textarea", "Trade references"),
  ],
  warehouse_receipt: [
    fld("warehouse", "text", "Warehouse", { required: true }),
    fld("depositor", "text", "Depositor", { required: true }),
    fld("goods", "textarea", "Goods stored", { required: true }),
    fld("date", "date", "Date"),
  ],
  performance_review: [
    fld("employee", "text", "Employee", { required: true }),
    fld("reviewer", "text", "Reviewer"),
    fld("period", "text", "Review period", { required: true }),
    fld("goals", "textarea", "Goals met"),
    fld("areas", "textarea", "Areas for improvement"),
    sig("employee_sign"),
    sig("manager_sign"),
  ],
  background_check: [
    fld("candidate", "text", "Candidate name", { required: true }),
    fld("dob", "date", "Date of birth"),
    fld("consent", "checkbox", "Background check consent", { required: true }),
    sig("candidate_sign"),
  ],
  will_declaration: [
    fld("testator", "text", "Testator name", { required: true }),
    fld("executors", "text", "Executors"),
    fld("beneficiaries", "textarea", "Beneficiaries & bequests", { required: true }),
    sig("testator_sign"),
    sig("witness_1", "Witness 1"),
  ],
  birth_registration: [
    fld("child", "text", "Child name", { required: true }),
    fld("dob", "date", "Date of birth", { required: true }),
    fld("place", "text", "Place of birth"),
    fld("father", "text", "Father name"),
    fld("mother", "text", "Mother name"),
  ],
  death_certificate: [
    fld("deceased", "text", "Deceased name", { required: true }),
    fld("dod", "date", "Date of death", { required: true }),
    fld("place", "text", "Place of death"),
    fld("applicant", "text", "Applicant name", { required: true }),
  ],
  divorce_petition: [
    fld("petitioner", "text", "Petitioner", { required: true }),
    fld("respondent", "text", "Respondent", { required: true }),
    fld("marriage_date", "date", "Marriage date"),
    fld("grounds", "textarea", "Grounds for divorce"),
    sig("petitioner_sign"),
  ],
  rent_increase: [
    fld("landlord", "text", "Landlord", { required: true }),
    fld("tenant", "text", "Tenant", { required: true }),
    fld("property", "textarea", "Property"),
    fld("current_rent", "number", "Current rent"),
    fld("new_rent", "number", "New rent", { required: true }),
    fld("effective", "date", "Effective date"),
  ],
  lease_termination: [
    fld("landlord", "text", "Landlord", { required: true }),
    fld("tenant", "text", "Tenant", { required: true }),
    fld("property", "textarea", "Property"),
    fld("termination_date", "date", "Termination date", { required: true }),
    fld("reason", "textarea", "Reason"),
  ],
  stock_transfer: [
    fld("transferor", "text", "Transferor", { required: true }),
    fld("transferee", "text", "Transferee", { required: true }),
    fld("shares", "number", "Number of shares", { required: true }),
    fld("company", "text", "Company name", { required: true }),
    sig("transferor_sign"),
  ],
  shareholder_register: [
    fld("company", "text", "Company", { required: true }),
    fld("shareholder", "text", "Shareholder name", { required: true }),
    fld("shares", "number", "Shares held"),
    fld("class", "text", "Share class"),
  ],
  board_resolution: [
    fld("company", "text", "Company", { required: true }),
    fld("date", "date", "Meeting date", { required: true }),
    fld("resolution", "textarea", "Resolution text", { required: true }),
    sig("director_sign", "Director signature"),
  ],
  meeting_minutes: [
    fld("organization", "text", "Organization", { required: true }),
    fld("date", "date", "Date", { required: true }),
    fld("attendees", "textarea", "Attendees"),
    fld("minutes", "textarea", "Minutes", { required: true }),
  ],
  sick_leave: [
    fld("employee", "text", "Employee", { required: true }),
    fld("from", "date", "From", { required: true }),
    fld("to", "date", "To", { required: true }),
    fld("doctor_note", "checkbox", "Medical certificate attached"),
  ],
  maternity_leave: [
    fld("employee", "text", "Employee", { required: true }),
    fld("due_date", "date", "Expected due date"),
    fld("start", "date", "Leave start", { required: true }),
    fld("duration", "text", "Duration"),
  ],
  overtime_claim: [
    fld("employee", "text", "Employee", { required: true }),
    fld("period", "text", "Pay period"),
    fld("hours", "number", "Overtime hours", { required: true }),
    fld("project", "text", "Project / task"),
  ],
  travel_expense: [
    fld("employee", "text", "Employee", { required: true }),
    fld("trip", "text", "Trip destination"),
    fld("expenses", "textarea", "Expenses breakdown", { required: true }),
    fld("total", "number", "Total"),
  ],
  pet_adoption: [
    fld("adopter", "text", "Adopter name", { required: true }),
    fld("address", "textarea", "Address", { required: true }),
    fld("pet", "text", "Pet description"),
    fld("agree", "checkbox", "Adoption terms agreed", { required: true }),
  ],
  child_care: [
    fld("parent", "text", "Parent / guardian", { required: true }),
    fld("child", "text", "Child name", { required: true }),
    fld("emergency", "text", "Emergency contact", { required: true }),
    fld("allergies", "textarea", "Allergies / medical notes"),
  ],
  parent_consent: [
    fld("parent", "text", "Parent name", { required: true }),
    fld("child", "text", "Child name", { required: true }),
    fld("activity", "text", "Activity", { required: true }),
    fld("date", "date", "Date"),
    sig("parent_sign"),
  ],
  field_trip: [
    fld("school", "text", "School", { required: true }),
    fld("student", "text", "Student name", { required: true }),
    fld("trip", "text", "Trip destination", { required: true }),
    fld("date", "date", "Date"),
    sig("parent_sign", "Parent consent signature"),
  ],
  blood_donation: [
    fld("donor", "text", "Donor name", { required: true }),
    fld("dob", "date", "Date of birth"),
    fld("weight", "number", "Weight (kg)"),
    fld("last_donation", "date", "Last donation date"),
    fld("eligible", "checkbox", "Eligibility confirmed", { required: true }),
  ],
  organ_donor: [
    fld("name", "text", "Name", { required: true }),
    idField("ID number"),
    fld("organs", "textarea", "Organs to donate"),
    sig("donor_sign"),
    sig("witness_sign"),
  ],
  covid_declaration: [
    fld("name", "text", "Name", { required: true }),
    fld("symptoms", "radio", "Any symptoms?", { options: ["No", "Yes"] }),
    fld("contact", "radio", "Close contact with case?", { options: ["No", "Yes"] }),
    fld("date", "date", "Date"),
  ],
  food_order: [
    fld("customer", "text", "Customer name"),
    fld("items", "textarea", "Order items", { required: true }),
    fld("delivery", "textarea", "Delivery address"),
    fld("phone", "phone", "Phone", { required: true }),
  ],
  catering_request: [
    fld("event", "text", "Event name", { required: true }),
    fld("date", "date", "Event date", { required: true }),
    fld("guests", "number", "Number of guests"),
    fld("menu", "textarea", "Menu requirements"),
  ],
  wedding_booking: [
    fld("couple", "text", "Couple names", { required: true }),
    fld("date", "date", "Wedding date", { required: true }),
    fld("venue", "text", "Venue preference"),
    fld("guests", "number", "Expected guests"),
    fld("package", "select", "Package", { options: ["Basic", "Standard", "Premium"] }),
  ],
  funeral_service: [
    fld("deceased", "text", "Deceased name", { required: true }),
    fld("contact", "text", "Contact person", { required: true }),
    fld("service_date", "date", "Service date"),
    fld("requests", "textarea", "Special requests"),
  ],
  real_estate_listing: [
    fld("agent", "text", "Agent", { required: true }),
    fld("address", "textarea", "Property address", { required: true }),
    fld("price", "number", "Listing price"),
    fld("bedrooms", "number", "Bedrooms"),
    fld("features", "textarea", "Features"),
  ],
  tenant_reference: [
    fld("tenant", "text", "Tenant name", { required: true }),
    fld("landlord", "text", "Previous landlord", { required: true }),
    fld("period", "text", "Tenancy period"),
    fld("rating", "radio", "Would you re-rent?", { options: ["Yes", "No"] }),
    sig("landlord_sign"),
  ],
  landlord_reference: [
    fld("tenant", "text", "Tenant applicant", { required: true }),
    fld("landlord", "text", "Current landlord", { required: true }),
    fld("rent_paid", "radio", "Rent paid on time?", { options: ["Always", "Sometimes", "No"] }),
  ],
  sublease: [
    fld("primary_tenant", "text", "Primary tenant", { required: true }),
    fld("subtenant", "text", "Subtenant", { required: true }),
    fld("property", "textarea", "Property"),
    fld("rent", "number", "Sublet rent"),
    fld("landlord_consent", "checkbox", "Landlord consent obtained"),
  ],
  room_rental: [
    fld("landlord", "text", "Landlord", { required: true }),
    fld("tenant", "text", "Tenant", { required: true }),
    fld("room", "text", "Room description"),
    fld("rent", "number", "Monthly rent", { required: true }),
    fld("house_rules", "textarea", "House rules"),
  ],
  commercial_lease: [
    fld("landlord", "text", "Landlord", { required: true }),
    fld("tenant", "text", "Tenant business", { required: true }),
    fld("premises", "textarea", "Commercial premises", { required: true }),
    fld("rent", "number", "Rent", { required: true }),
    fld("use", "text", "Permitted use"),
    sig("landlord_sign"),
    sig("tenant_sign"),
  ],
  office_lease: [
    fld("lessor", "text", "Lessor", { required: true }),
    fld("lessee", "text", "Lessee", { required: true }),
    fld("office", "textarea", "Office space", { required: true }),
    fld("rent", "number", "Monthly rent"),
    fld("term", "text", "Lease term"),
  ],
  equipment_lease: [
    fld("lessor", "text", "Lessor", { required: true }),
    fld("lessee", "text", "Lessee", { required: true }),
    fld("equipment", "textarea", "Equipment description", { required: true }),
    fld("rent", "number", "Lease payment"),
  ],
  construction_permit_info: [
    fld("applicant", "text", "Applicant", { required: true }),
    fld("site", "textarea", "Construction site", { required: true }),
    fld("project", "textarea", "Project description", { required: true }),
    fld("contractor", "text", "Contractor"),
  ],
  building_inspection: [
    fld("building", "textarea", "Building address", { required: true }),
    fld("inspector", "text", "Inspector"),
    fld("date", "date", "Date"),
    fld("result", "select", "Result", { options: ["Pass", "Fail", "Conditional"] }),
    fld("notes", "textarea", "Notes"),
  ],
  zoning_application: [
    fld("applicant", "text", "Applicant", { required: true }),
    fld("property", "textarea", "Property", { required: true }),
    fld("zoning_request", "textarea", "Zoning change request", { required: true }),
  ],
  freedom_of_information: [
    fld("requester", "text", "Requester", { required: true }),
    fld("contact", "text", "Contact"),
    fld("records", "textarea", "Records requested", { required: true }),
    fld("format", "select", "Format", { options: ["Electronic", "Paper", "Inspect"] }),
  ],
  rti_application: [
    fld("applicant", "text", "Applicant name", { required: true }),
    fld("address", "textarea", "Address", { required: true }),
    fld("department", "text", "Public authority", { required: true }),
    fld("information", "textarea", "Information sought", { required: true }),
  ],
  foia_request: [
    fld("requester", "text", "Requester", { required: true }),
    fld("agency", "text", "Federal agency", { required: true }),
    fld("records", "textarea", "Records description", { required: true }),
    fld("fee_category", "select", "Fee category", { options: ["Commercial", "Educational", "News media", "Other"] }),
  ],
  passport_renewal: [
    fld("name", "text", "Full name", { required: true }),
    fld("passport_no", "text", "Current passport #"),
    fld("dob", "date", "Date of birth", { required: true }),
    fld("expiry", "date", "Passport expiry"),
    fld("address", "textarea", "Address"),
  ],
  national_id: [
    fld("name", "text", "Full name", { required: true }),
    fld("dob", "date", "Date of birth", { required: true }),
    fld("birth_place", "text", "Place of birth"),
    fld("address", "textarea", "Address", { required: true }),
    fld("father", "text", "Father name"),
    fld("mother", "text", "Mother name"),
  ],
  voter_registration: [
    fld("name", "text", "Full name", { required: true }),
    fld("address", "textarea", "Residential address", { required: true }),
    fld("dob", "date", "Date of birth"),
    idField("ID number"),
  ],
  tax_exemption: [
    fld("taxpayer", "text", "Taxpayer name", { required: true }),
    fld("tax_id", "text", "Tax ID", { required: true }),
    fld("exemption_type", "text", "Exemption type", { required: true }),
    fld("justification", "textarea", "Justification"),
  ],
  charity_registration: [
    fld("org", "text", "Organization name", { required: true }),
    fld("mission", "textarea", "Mission", { required: true }),
    fld("trustees", "textarea", "Trustees / directors"),
    fld("address", "textarea", "Registered address"),
  ],
  grant_application: [
    fld("org", "text", "Organization", { required: true }),
    fld("project", "text", "Project title", { required: true }),
    fld("amount", "number", "Amount requested"),
    fld("summary", "textarea", "Project summary", { required: true }),
    fld("budget", "textarea", "Budget outline"),
  ],
  project_proposal: [
    fld("proposer", "text", "Proposer", { required: true }),
    fld("title", "text", "Project title", { required: true }),
    fld("objectives", "textarea", "Objectives", { required: true }),
    fld("timeline", "text", "Timeline"),
    fld("budget", "number", "Budget"),
  ],
  bid_submission: [
    fld("bidder", "text", "Bidder company", { required: true }),
    fld("tender", "text", "Tender reference", { required: true }),
    fld("amount", "number", "Bid amount", { required: true }),
    fld("validity", "date", "Bid validity"),
    sig("authorized_sign"),
  ],
  tender_application: [
    fld("company", "text", "Company", { required: true }),
    fld("tender_no", "text", "Tender #", { required: true }),
    fld("experience", "textarea", "Relevant experience"),
    fld("documents", "textarea", "Documents enclosed"),
  ],
  quality_inspection: [
    fld("product", "text", "Product / batch", { required: true }),
    fld("inspector", "text", "Inspector"),
    fld("date", "date", "Date"),
    fld("result", "select", "Result", { options: ["Pass", "Fail", "Hold"] }),
    fld("defects", "textarea", "Defects noted"),
  ],
  return_merchandise: [
    fld("customer", "text", "Customer", { required: true }),
    fld("order", "text", "Order #", { required: true }),
    fld("items", "textarea", "Items to return", { required: true }),
    fld("reason", "select", "Reason", { options: ["Defective", "Wrong item", "Changed mind", "Other"] }),
  ],
  change_of_address: [
    fld("name", "text", "Name", { required: true }),
    idField("ID number"),
    fld("old_address", "textarea", "Old address", { required: true }),
    fld("new_address", "textarea", "New address", { required: true }),
    fld("effective", "date", "Effective date"),
  ],
  name_change: [
    fld("current_name", "text", "Current legal name", { required: true }),
    fld("new_name", "text", "New name requested", { required: true }),
    fld("reason", "textarea", "Reason"),
    sig("applicant_sign"),
  ],
  salary_certificate: [
    fld("employee", "text", "Employee name", { required: true }),
    fld("employer", "text", "Employer", { required: true }),
    fld("designation", "text", "Designation"),
    fld("salary", "number", "Monthly salary", { required: true }),
    fld("joining", "date", "Joining date"),
    sig("hr_sign", "HR signature"),
  ],
  experience_letter: [
    fld("employee", "text", "Employee", { required: true }),
    fld("employer", "text", "Employer", { required: true }),
    fld("from", "date", "From"),
    fld("to", "date", "To"),
    fld("role", "text", "Role"),
  ],
  bonafide_certificate: [
    fld("student", "text", "Student / employee name", { required: true }),
    fld("institution", "text", "Institution / company", { required: true }),
    fld("purpose", "text", "Purpose", { required: true }),
  ],
  no_objection_certificate: [
    fld("applicant", "text", "Applicant", { required: true }),
    fld("employer", "text", "Issuing organization", { required: true }),
    fld("purpose", "text", "Purpose", { required: true }),
    fld("details", "textarea", "Details"),
  ],
  salary_transfer: [
    fld("employee", "text", "Employee", { required: true }),
    fld("bank", "text", "Bank name", { required: true }),
    fld("account", "text", "Account number", { required: true }),
    fld("employer", "text", "Employer", { required: true }),
  ],
  bank_guarantee: [
    fld("applicant", "text", "Applicant", { required: true }),
    fld("beneficiary", "text", "Beneficiary", { required: true }),
    fld("amount", "number", "Guarantee amount", { required: true }),
    fld("expiry", "date", "Expiry date"),
  ],
  letter_of_credit: [
    fld("applicant", "text", "Applicant", { required: true }),
    fld("beneficiary", "text", "Beneficiary", { required: true }),
    fld("amount", "number", "Amount", { required: true }),
    fld("goods", "textarea", "Goods description"),
  ],
  promissory_note: [
    fld("borrower", "text", "Borrower", { required: true }),
    fld("lender", "text", "Lender", { required: true }),
    fld("amount", "number", "Principal amount", { required: true }),
    fld("due_date", "date", "Due date", { required: true }),
    sig("borrower_sign"),
  ],
  loan_guarantor: [
    fld("borrower", "text", "Borrower", { required: true }),
    fld("guarantor", "text", "Guarantor", { required: true }),
    fld("loan_amount", "number", "Loan amount"),
    fld("relationship", "text", "Relationship to borrower"),
    sig("guarantor_sign"),
  ],
  rental_bond: [
    fld("tenant", "text", "Tenant", { required: true }),
    fld("landlord", "text", "Landlord / agent"),
    fld("property", "textarea", "Property"),
    fld("bond", "number", "Bond amount", { required: true }),
  ],
  deposit_refund: [
    fld("tenant", "text", "Tenant", { required: true }),
    fld("landlord", "text", "Landlord"),
    fld("deposit", "number", "Deposit amount", { required: true }),
    fld("deductions", "textarea", "Deductions (if any)"),
    fld("refund", "number", "Refund amount"),
  ],
  inventory_count: [
    fld("location", "text", "Location / warehouse", { required: true }),
    fld("date", "date", "Count date", { required: true }),
    fld("items", "textarea", "Inventory items & quantities", { required: true }),
    fld("counter", "text", "Counted by"),
  ],
  stock_request: [
    fld("requester", "text", "Requester", { required: true }),
    fld("department", "text", "Department"),
    fld("items", "textarea", "Items requested", { required: true }),
    fld("needed_by", "date", "Needed by"),
  ],
  material_requisition: [
    fld("project", "text", "Project", { required: true }),
    fld("requester", "text", "Requested by", { required: true }),
    fld("materials", "textarea", "Materials list", { required: true }),
    fld("date", "date", "Date required"),
  ],
};

export const BLUEPRINT_META: Record<
  BlueprintId,
  { name: string; category: string; title: string; description: string }
> = {
  rent: { name: "Rent / Lease Agreement", category: "Housing", title: "Rent / Lease Agreement", description: "Residential or standard lease agreement." },
  job: { name: "Job Application", category: "Employment", title: "Job Application Form", description: "Standard employment application." },
  employment_contract: { name: "Employment Contract", category: "Employment", title: "Employment Contract", description: "Employee contract details." },
  school_admission: { name: "School Admission", category: "Education", title: "School Admission Form", description: "Student admission application." },
  college_application: { name: "College Application", category: "Education", title: "College Application", description: "Higher education application." },
  medical_intake: { name: "Medical Intake", category: "Medical", title: "Medical Intake Form", description: "Patient medical history intake." },
  dental_intake: { name: "Dental Intake", category: "Medical", title: "Dental Patient Form", description: "Dental clinic intake." },
  invoice: { name: "Invoice", category: "Business", title: "Invoice", description: "Bill for goods or services." },
  tax_invoice: { name: "Tax Invoice", category: "Business", title: "Tax Invoice", description: "Tax-compliant invoice." },
  quotation: { name: "Quotation / Quote", category: "Business", title: "Quotation", description: "Price quotation for client." },
  purchase_order: { name: "Purchase Order", category: "Business", title: "Purchase Order", description: "PO to vendor." },
  delivery_note: { name: "Delivery Note", category: "Business", title: "Delivery Note", description: "Proof of delivery." },
  receipt: { name: "Payment Receipt", category: "Business", title: "Receipt", description: "Payment acknowledgment." },
  proforma_invoice: { name: "Proforma Invoice", category: "Business", title: "Proforma Invoice", description: "Preliminary invoice." },
  expense_claim: { name: "Expense Claim", category: "Employment", title: "Expense Claim", description: "Employee expense reimbursement." },
  leave: { name: "Leave Application", category: "Employment", title: "Leave Application", description: "Employee leave request." },
  timesheet: { name: "Timesheet", category: "Employment", title: "Timesheet", description: "Weekly hours log." },
  resignation: { name: "Resignation Letter", category: "Employment", title: "Resignation Form", description: "Employee resignation." },
  offer_letter: { name: "Job Offer Letter", category: "Employment", title: "Offer Letter", description: "Employment offer to candidate." },
  internship: { name: "Internship Application", category: "Employment", title: "Internship Form", description: "Internship agreement." },
  volunteer: { name: "Volunteer Registration", category: "General", title: "Volunteer Registration", description: "Volunteer sign-up." },
  donation: { name: "Donation Form", category: "General", title: "Donation Form", description: "Charitable donation record." },
  membership: { name: "Membership Application", category: "General", title: "Membership Application", description: "Join an organization." },
  event_registration: { name: "Event Registration", category: "General", title: "Event Registration", description: "Event attendee registration." },
  hotel_booking: { name: "Hotel Booking", category: "Travel", title: "Hotel Booking Form", description: "Hotel reservation request." },
  travel_request: { name: "Travel Request", category: "Travel", title: "Travel Authorization", description: "Business travel request." },
  visa_support: { name: "Visa Support Letter Info", category: "Travel", title: "Visa Support Form", description: "Visa application supporting info." },
  driving_license: { name: "Driving License Application", category: "Government", title: "Driving License Application", description: "Driver license application info." },
  vehicle_sale: { name: "Vehicle Sale Agreement", category: "Legal", title: "Vehicle Sale Agreement", description: "Motor vehicle sale contract." },
  vehicle_purchase: { name: "Vehicle Purchase", category: "Legal", title: "Vehicle Purchase Form", description: "Vehicle purchase record." },
  insurance_claim: { name: "Insurance Claim", category: "Insurance", title: "Insurance Claim Form", description: "File an insurance claim." },
  insurance_application: { name: "Insurance Application", category: "Insurance", title: "Insurance Application", description: "Apply for insurance coverage." },
  loan_application: { name: "Loan Application", category: "Finance", title: "Loan Application", description: "Personal or business loan request." },
  bank_account: { name: "Bank Account Opening", category: "Finance", title: "Bank Account Opening", description: "Open a new bank account." },
  kyc_form: { name: "KYC / Customer Due Diligence", category: "Finance", title: "KYC Form", description: "Know your customer form." },
  power_of_attorney: { name: "Power of Attorney", category: "Legal", title: "Power of Attorney", description: "Grant legal authority to agent." },
  affidavit: { name: "Affidavit", category: "Legal", title: "Affidavit", description: "Sworn written statement." },
  marriage_registration: { name: "Marriage Registration", category: "Legal", title: "Marriage Registration", description: "Marriage record form." },
  complaint: { name: "Complaint Form", category: "General", title: "Complaint Form", description: "Formal complaint submission." },
  grievance: { name: "Employee Grievance", category: "Employment", title: "Grievance Form", description: "Workplace grievance." },
  feedback: { name: "Feedback Form", category: "General", title: "Feedback Form", description: "Customer feedback survey." },
  consent_medical: { name: "Medical Consent", category: "Medical", title: "Medical Consent Form", description: "Treatment consent." },
  consent_general: { name: "General Consent", category: "Legal", title: "Consent Form", description: "General consent and agreement." },
  nda: { name: "Non-Disclosure Agreement", category: "Legal", title: "NDA", description: "Confidentiality agreement." },
  partnership: { name: "Partnership Agreement", category: "Business", title: "Partnership Agreement", description: "Business partnership terms." },
  vendor_registration: { name: "Vendor Registration", category: "Business", title: "Vendor Registration", description: "Register as supplier." },
  client_onboarding: { name: "Client Onboarding", category: "Business", title: "Client Onboarding", description: "New client intake." },
  supplier_registration: { name: "Supplier Registration", category: "Business", title: "Supplier Registration", description: "Supplier signup." },
  maintenance_request: { name: "Maintenance Request", category: "General", title: "Maintenance Request", description: "Facility maintenance ticket." },
  it_support: { name: "IT Support Ticket", category: "General", title: "IT Support Request", description: "Technical support request." },
  asset_handover: { name: "Asset Handover", category: "Employment", title: "Asset Handover Form", description: "Hand over company assets." },
  exit_interview: { name: "Exit Interview", category: "Employment", title: "Exit Interview", description: "Employee exit feedback." },
  reference_check: { name: "Reference Check", category: "Employment", title: "Reference Check Form", description: "Employment reference." },
  tenant_application: { name: "Tenant Application", category: "Housing", title: "Tenant Application", description: "Rental applicant screening." },
  property_inspection: { name: "Property Inspection", category: "Housing", title: "Property Inspection", description: "Property condition report." },
  utility_connection: { name: "Utility Connection", category: "Government", title: "Utility Connection Request", description: "New utility connection." },
  scholarship: { name: "Scholarship Application", category: "Education", title: "Scholarship Application", description: "Apply for scholarship." },
  refund_request: { name: "Refund Request", category: "Business", title: "Refund Request", description: "Customer refund request." },
  warranty_claim: { name: "Warranty Claim", category: "Business", title: "Warranty Claim", description: "Product warranty claim." },
  gym_membership: { name: "Gym Membership", category: "General", title: "Gym Membership Form", description: "Fitness club membership." },
  parking_permit: { name: "Parking Permit", category: "General", title: "Parking Permit Application", description: "Parking permit request." },
  contractor_agreement: { name: "Contractor Agreement", category: "Business", title: "Contractor Agreement", description: "Independent contractor contract." },
  freelance_agreement: { name: "Freelance Agreement", category: "Business", title: "Freelance Contract", description: "Freelance services agreement." },
  domestic_worker: { name: "Domestic Worker Contract", category: "Employment", title: "Domestic Worker Contract", description: "Household staff employment." },
  police_verification: { name: "Police Verification", category: "Government", title: "Police Verification Request", description: "Character / police clearance info." },
  character_certificate: { name: "Character Certificate Request", category: "Government", title: "Character Certificate", description: "Request character certificate." },
  trade_license: { name: "Trade License Application", category: "Business", title: "Trade License Application", description: "Business trade license." },
  import_export: { name: "Import / Export Declaration", category: "Business", title: "Import Export Form", description: "Trade declaration info." },
  shipping_form: { name: "Shipping Form", category: "Business", title: "Shipping Form", description: "Ship goods documentation." },
  customs_declaration: { name: "Customs Declaration", category: "Government", title: "Customs Declaration", description: "Customs entry declaration." },
  credit_application: { name: "Credit Application", category: "Finance", title: "Business Credit Application", description: "Apply for trade credit." },
  warehouse_receipt: { name: "Warehouse Receipt", category: "Business", title: "Warehouse Receipt", description: "Goods stored receipt." },
  performance_review: { name: "Performance Review", category: "Employment", title: "Performance Review", description: "Employee appraisal." },
  background_check: { name: "Background Check Consent", category: "Employment", title: "Background Check Authorization", description: "Consent for background check." },
  will_declaration: { name: "Last Will Declaration", category: "Legal", title: "Will Declaration", description: "Basic will information form." },
  birth_registration: { name: "Birth Registration", category: "Government", title: "Birth Registration", description: "Register a birth." },
  death_certificate: { name: "Death Certificate Request", category: "Government", title: "Death Certificate Request", description: "Request death certificate." },
  divorce_petition: { name: "Divorce Petition", category: "Legal", title: "Divorce Petition", description: "Divorce filing information." },
  rent_increase: { name: "Rent Increase Notice", category: "Housing", title: "Rent Increase Notice", description: "Notify tenant of rent increase." },
  lease_termination: { name: "Lease Termination", category: "Housing", title: "Lease Termination Notice", description: "End a lease agreement." },
  stock_transfer: { name: "Stock Transfer", category: "Business", title: "Stock Transfer Form", description: "Transfer share ownership." },
  shareholder_register: { name: "Shareholder Register Entry", category: "Business", title: "Shareholder Register", description: "Record shareholder details." },
  board_resolution: { name: "Board Resolution", category: "Business", title: "Board Resolution", description: "Corporate board resolution." },
  meeting_minutes: { name: "Meeting Minutes", category: "Business", title: "Meeting Minutes", description: "Record meeting minutes." },
  sick_leave: { name: "Sick Leave", category: "Employment", title: "Sick Leave Application", description: "Medical leave request." },
  maternity_leave: { name: "Maternity Leave", category: "Employment", title: "Maternity Leave Form", description: "Maternity leave application." },
  overtime_claim: { name: "Overtime Claim", category: "Employment", title: "Overtime Claim", description: "Claim overtime hours." },
  travel_expense: { name: "Travel Expense Report", category: "Employment", title: "Travel Expense Report", description: "Travel costs reimbursement." },
  pet_adoption: { name: "Pet Adoption", category: "General", title: "Pet Adoption Form", description: "Animal adoption application." },
  child_care: { name: "Child Care Registration", category: "Education", title: "Child Care Form", description: "Daycare / child care intake." },
  parent_consent: { name: "Parent Consent", category: "Education", title: "Parent Consent Form", description: "Parental consent for activity." },
  field_trip: { name: "School Field Trip Consent", category: "Education", title: "Field Trip Permission", description: "School trip parental consent." },
  blood_donation: { name: "Blood Donation", category: "Medical", title: "Blood Donation Form", description: "Blood donor registration." },
  organ_donor: { name: "Organ Donor Registration", category: "Medical", title: "Organ Donor Form", description: "Organ donation registration." },
  covid_declaration: { name: "Health Declaration", category: "Medical", title: "Health Declaration Form", description: "Health screening declaration." },
  food_order: { name: "Food Order Form", category: "General", title: "Food Order", description: "Restaurant / catering order." },
  catering_request: { name: "Catering Request", category: "General", title: "Catering Request", description: "Event catering inquiry." },
  wedding_booking: { name: "Wedding Booking", category: "General", title: "Wedding Booking Form", description: "Wedding venue / service booking." },
  funeral_service: { name: "Funeral Service Request", category: "General", title: "Funeral Service Form", description: "Funeral arrangement request." },
  real_estate_listing: { name: "Real Estate Listing", category: "Housing", title: "Property Listing Form", description: "List property for sale/rent." },
  tenant_reference: { name: "Tenant Reference", category: "Housing", title: "Tenant Reference", description: "Landlord reference for tenant." },
  landlord_reference: { name: "Landlord Reference", category: "Housing", title: "Landlord Reference", description: "Reference from landlord." },
  sublease: { name: "Sublease Agreement", category: "Housing", title: "Sublease Agreement", description: "Sublet rental agreement." },
  room_rental: { name: "Room Rental Agreement", category: "Housing", title: "Room Rental Agreement", description: "Single room rental." },
  commercial_lease: { name: "Commercial Lease", category: "Housing", title: "Commercial Lease", description: "Business property lease." },
  office_lease: { name: "Office Lease", category: "Housing", title: "Office Lease Agreement", description: "Office space rental." },
  equipment_lease: { name: "Equipment Lease", category: "Business", title: "Equipment Lease", description: "Lease equipment." },
  construction_permit_info: { name: "Construction Permit Info", category: "Government", title: "Construction Permit Application", description: "Building permit information." },
  building_inspection: { name: "Building Inspection", category: "Government", title: "Building Inspection Report", description: "Building inspection record." },
  zoning_application: { name: "Zoning Application", category: "Government", title: "Zoning Application", description: "Zoning change request." },
  freedom_of_information: { name: "Freedom of Information Request", category: "Government", title: "FOI Request", description: "Access to public records." },
  rti_application: { name: "RTI Application (India)", category: "Government", title: "RTI Application", description: "Right to Information request India." },
  foia_request: { name: "FOIA Request (USA)", category: "Government", title: "FOIA Request", description: "Freedom of Information Act US." },
  passport_renewal: { name: "Passport Renewal", category: "Government", title: "Passport Renewal Application", description: "Passport renewal info." },
  national_id: { name: "National ID Application", category: "Government", title: "National ID Application", description: "National identity registration." },
  voter_registration: { name: "Voter Registration", category: "Government", title: "Voter Registration", description: "Register to vote." },
  tax_exemption: { name: "Tax Exemption Application", category: "Finance", title: "Tax Exemption Request", description: "Apply for tax exemption." },
  charity_registration: { name: "Charity Registration", category: "Government", title: "Charity Registration", description: "Register charitable organization." },
  grant_application: { name: "Grant Application", category: "Business", title: "Grant Application", description: "Apply for funding grant." },
  project_proposal: { name: "Project Proposal", category: "Business", title: "Project Proposal", description: "Submit project proposal." },
  bid_submission: { name: "Bid Submission", category: "Business", title: "Bid Submission Form", description: "Tender bid submission." },
  tender_application: { name: "Tender Application", category: "Business", title: "Tender Application", description: "Apply for tender." },
  quality_inspection: { name: "Quality Inspection", category: "Business", title: "Quality Inspection Report", description: "QC inspection record." },
  return_merchandise: { name: "Return Merchandise (RMA)", category: "Business", title: "Return Merchandise Form", description: "Product return request." },
  change_of_address: { name: "Change of Address", category: "Government", title: "Change of Address Notification", description: "Official address change." },
  name_change: { name: "Legal Name Change", category: "Government", title: "Name Change Application", description: "Request legal name change." },
  salary_certificate: { name: "Salary Certificate", category: "Employment", title: "Salary Certificate", description: "Employee salary certificate." },
  experience_letter: { name: "Experience Letter Request", category: "Employment", title: "Experience Letter", description: "Employment experience letter." },
  bonafide_certificate: { name: "Bonafide Certificate", category: "Education", title: "Bonafide Certificate Request", description: "Student/employee bonafide." },
  no_objection_certificate: { name: "No Objection Certificate (NOC)", category: "Employment", title: "NOC Application", description: "No objection certificate request." },
  salary_transfer: { name: "Salary Transfer Letter", category: "Finance", title: "Salary Transfer Authorization", description: "Direct salary to bank." },
  bank_guarantee: { name: "Bank Guarantee Request", category: "Finance", title: "Bank Guarantee Application", description: "Request bank guarantee." },
  letter_of_credit: { name: "Letter of Credit", category: "Finance", title: "Letter of Credit Application", description: "Trade finance LC." },
  promissory_note: { name: "Promissory Note", category: "Finance", title: "Promissory Note", description: "Written loan promise." },
  loan_guarantor: { name: "Loan Guarantor Form", category: "Finance", title: "Loan Guarantor", description: "Guarantee someone else's loan." },
  rental_bond: { name: "Rental Bond / Deposit", category: "Housing", title: "Rental Bond Form", description: "Tenancy bond lodgement." },
  deposit_refund: { name: "Deposit Refund", category: "Housing", title: "Security Deposit Refund", description: "Return tenancy deposit." },
  inventory_count: { name: "Inventory Count", category: "Business", title: "Inventory Count Sheet", description: "Stock inventory count." },
  stock_request: { name: "Stock Request", category: "Business", title: "Stock Requisition", description: "Request stock items." },
  material_requisition: { name: "Material Requisition", category: "Business", title: "Material Requisition", description: "Request project materials." },
};

export const FORM_CATEGORIES = [
  "All categories",
  "Housing",
  "Employment",
  "Education",
  "Medical",
  "Business",
  "Legal",
  "Finance",
  "Government",
  "Insurance",
  "Travel",
  "General",
] as const;
