export type ProductCategory = "AWS" | "Azure" | "GCP" | "Oracle" | "Salesforce" | "ServiceNow" | "GitHub";

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  image: string;
  description: string;
  examCode?: string;
  level: "Associate" | "Practitioner" | "Professional" | "Specialty";
}

export const products: Product[] = [
  // AWS Associate Level Certifications
  {
    id: "aws-saa-associate",
    title: "AWS Certified Solutions Architect - Associate (SAA-C03)",
    category: "AWS",
    originalPrice: 15900,
    discountedPrice: 1,
    discount: 50,
    image: "https://s3.ap-south-1.amazonaws.com/rzp-prod-merchant-assets/payment-link/description/ruxz47ntxgale8.jpeg",
    description: "Limited Time Offer | Flat 50% OFF! + GST This product is eligible for one AWS Associate–level certification exam only, as per AWS voucher guidelines. Each voucher can be used for a single exam attempt and is valid for one specific exam only. Vouchers are non-transferable, non-reusable, and once redeemed, they cannot be applied to any other exam. Eligible exams include AWS Certified Solutions Architect – Associate (SAA-C03), AWS Certified Developer – Associate (DVA-C02), AWS Certified CloudOps Engineer – Associate (SOA-C03), AWS Certified Data Engineer – Associate (DEA-C01), and AWS Certified Machine Learning Engineer – Associate (MLA-C01). Please ensure you select the correct exam before redeeming the voucher, as changes are not permitted after redemption. If you're unsure which exam aligns with your role or career path, feel free to reach out before purchase. Thank you for choosing Yatri Cloud and investing in your cloud journey.",
    examCode: "SAA-C03",
    level: "Associate",
  },
  {
    id: "aws-dva-associate",
    title: "AWS Certified Developer - Associate (DVA-C02)",
    category: "AWS",
    originalPrice: 15900,
    discountedPrice: 1,
    discount: 50,
    image: "https://s3.ap-south-1.amazonaws.com/rzp-prod-merchant-assets/payment-link/description/ryubxr2lzgtr6z.jpeg",
    description: "Limited Time Offer | Flat 50% OFF! + GST This product is eligible for one AWS Associate–level certification exam only, as per AWS voucher guidelines. Each voucher can be used for a single exam attempt and is valid for one specific exam only. Vouchers are non-transferable, non-reusable, and once redeemed, they cannot be applied to any other exam. Eligible exams include AWS Certified Solutions Architect – Associate (SAA-C03), AWS Certified Developer – Associate (DVA-C02), AWS Certified CloudOps Engineer – Associate (SOA-C03), AWS Certified Data Engineer – Associate (DEA-C01), and AWS Certified Machine Learning Engineer – Associate (MLA-C01). Please ensure you select the correct exam before redeeming the voucher, as changes are not permitted after redemption. If you're unsure which exam aligns with your role or career path, feel free to reach out before purchase. Thank you for choosing Yatri Cloud and investing in your cloud journey.",
    examCode: "DVA-C02",
    level: "Associate",
  },
  {
    id: "aws-soa-associate",
    title: "AWS Certified CloudOps Engineer - Associate (SOA-C03)",
    category: "AWS",
    originalPrice: 15900,
    discountedPrice: 1,
    discount: 50,
    image: "https://s3.ap-south-1.amazonaws.com/rzp-prod-merchant-assets/payment-link/description/ruxz47ntxgale8.jpeg",
    description: "Limited Time Offer | Flat 50% OFF! + GST This product is eligible for one AWS Associate–level certification exam only, as per AWS voucher guidelines. Each voucher can be used for a single exam attempt and is valid for one specific exam only. Vouchers are non-transferable, non-reusable, and once redeemed, they cannot be applied to any other exam. Eligible exams include AWS Certified Solutions Architect – Associate (SAA-C03), AWS Certified Developer – Associate (DVA-C02), AWS Certified CloudOps Engineer – Associate (SOA-C03), AWS Certified Data Engineer – Associate (DEA-C01), and AWS Certified Machine Learning Engineer – Associate (MLA-C01). Please ensure you select the correct exam before redeeming the voucher, as changes are not permitted after redemption. If you're unsure which exam aligns with your role or career path, feel free to reach out before purchase. Thank you for choosing Yatri Cloud and investing in your cloud journey.",
    examCode: "SOA-C03",
    level: "Associate",
  },
  {
    id: "aws-dea-associate",
    title: "AWS Certified Data Engineer - Associate (DEA-C01)",
    category: "AWS",
    originalPrice: 15900,
    discountedPrice: 1,
    discount: 50,
    image: "https://s3.ap-south-1.amazonaws.com/rzp-prod-merchant-assets/payment-link/description/ruxz47ntxgale8.jpeg",
    description: "Limited Time Offer | Flat 50% OFF! + GST This product is eligible for one AWS Associate–level certification exam only, as per AWS voucher guidelines. Each voucher can be used for a single exam attempt and is valid for one specific exam only. Vouchers are non-transferable, non-reusable, and once redeemed, they cannot be applied to any other exam. Eligible exams include AWS Certified Solutions Architect – Associate (SAA-C03), AWS Certified Developer – Associate (DVA-C02), AWS Certified CloudOps Engineer – Associate (SOA-C03), AWS Certified Data Engineer – Associate (DEA-C01), and AWS Certified Machine Learning Engineer – Associate (MLA-C01). Please ensure you select the correct exam before redeeming the voucher, as changes are not permitted after redemption. If you're unsure which exam aligns with your role or career path, feel free to reach out before purchase. Thank you for choosing Yatri Cloud and investing in your cloud journey.",
    examCode: "DEA-C01",
    level: "Associate",
  },
  {
    id: "aws-mla-associate",
    title: "AWS Certified Machine Learning Engineer - Associate (MLA-C01)",
    category: "AWS",
    originalPrice: 15900,
    discountedPrice: 1,
    discount: 50,
    image: "https://s3.ap-south-1.amazonaws.com/rzp-prod-merchant-assets/payment-link/description/ruxz47ntxgale8.jpeg",
    description: "Limited Time Offer | Flat 50% OFF! + GST This product is eligible for one AWS Associate–level certification exam only, as per AWS voucher guidelines. Each voucher can be used for a single exam attempt and is valid for one specific exam only. Vouchers are non-transferable, non-reusable, and once redeemed, they cannot be applied to any other exam. Eligible exams include AWS Certified Solutions Architect – Associate (SAA-C03), AWS Certified Developer – Associate (DVA-C02), AWS Certified CloudOps Engineer – Associate (SOA-C03), AWS Certified Data Engineer – Associate (DEA-C01), and AWS Certified Machine Learning Engineer – Associate (MLA-C01). Please ensure you select the correct exam before redeeming the voucher, as changes are not permitted after redemption. If you're unsure which exam aligns with your role or career path, feel free to reach out before purchase. Thank you for choosing Yatri Cloud and investing in your cloud journey.",
    examCode: "MLA-C01",
    level: "Associate",
  },
  // AWS Practitioner Level Certifications
  {
    id: "aws-ccp-practitioner",
    title: "AWS Certified Cloud Practitioner (CLF-C02)",
    category: "AWS",
    originalPrice: 15900,
    discountedPrice: 1,
    discount: 50,
    image: "https://s3.ap-south-1.amazonaws.com/rzp-prod-merchant-assets/payment-link/description/ruxz47ntxgale8.jpeg",
    description: "Limited Time Offer | Flat 50% OFF! + GST This product is eligible for one AWS Practitioner–level certification exam only, as per AWS voucher guidelines. Each voucher can be used for a single exam attempt and is valid for one specific exam only. Vouchers are non-transferable, non-reusable, and once redeemed, they cannot be applied to any other exam. Please ensure you select the correct exam before redeeming the voucher, as changes are not permitted after redemption. If you're unsure which exam aligns with your role or career path, feel free to reach out before purchase. Thank you for choosing Yatri Cloud and investing in your cloud journey.",
    examCode: "CLF-C02",
    level: "Practitioner",
  },
  {
    id: "aws-ccp-practitioner-2",
    title: "AWS Certified Cloud Practitioner (CLF-C03)",
    category: "AWS",
    originalPrice: 15900,
    discountedPrice: 1,
    discount: 50,
    image: "https://s3.ap-south-1.amazonaws.com/rzp-prod-merchant-assets/payment-link/description/ryubxr2lzgtr6z.jpeg",
    description: "Limited Time Offer | Flat 50% OFF! + GST This product is eligible for one AWS Practitioner–level certification exam only, as per AWS voucher guidelines. Each voucher can be used for a single exam attempt and is valid for one specific exam only. Vouchers are non-transferable, non-reusable, and once redeemed, they cannot be applied to any other exam. Please ensure you select the correct exam before redeeming the voucher, as changes are not permitted after redemption. If you're unsure which exam aligns with your role or career path, feel free to reach out before purchase. Thank you for choosing Yatri Cloud and investing in your cloud journey.",
    examCode: "CLF-C03",
    level: "Practitioner",
  },
];

export const categories: ProductCategory[] = ["AWS", "Azure", "GCP", "Oracle", "Salesforce", "ServiceNow", "GitHub"];


