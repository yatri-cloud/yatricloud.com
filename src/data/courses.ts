export interface Course {
  id: string;
  title: string;
  category: string;
  certification: string;
  creator: string;
  enrollments: number;
  rating: number;
  udemyUrl: string;
  thumbnail: string;
  headline?: string;
  price?: string;
  isPaid?: boolean;
}

export const courses: Course[] = [
  {
    id: "1",
    title: "AWS Cloud Practitioner Practice Exam",
    category: "Cloud Computing",
    certification: "AWS",
    creator: "Yatri Cloud",
    enrollments: 12500,
    rating: 4.7,
    udemyUrl: "https://www.udemy.com/course/aws-cloud-practitioner-practice-exam/",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop"
  },
  {
    id: "2",
    title: "Azure Fundamentals AZ-900 Practice Test",
    category: "Cloud Computing",
    certification: "Azure",
    creator: "Yatri Cloud",
    enrollments: 9800,
    rating: 4.8,
    udemyUrl: "https://www.udemy.com/course/azure-fundamentals-az900-practice-test/",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop"
  },
  {
    id: "3",
    title: "DevOps Foundation Practice Questions",
    category: "DevOps",
    certification: "DevOps",
    creator: "Yatri Cloud",
    enrollments: 7600,
    rating: 4.6,
    udemyUrl: "https://www.udemy.com/course/devops-foundation-practice/",
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=225&fit=crop"
  },
  {
    id: "4",
    title: "Terraform Associate Practice Exam",
    category: "Infrastructure",
    certification: "Terraform",
    creator: "Yatri Cloud",
    enrollments: 5400,
    rating: 4.7,
    udemyUrl: "https://www.udemy.com/course/terraform-associate-practice/",
    thumbnail: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=225&fit=crop"
  },
  {
    id: "5",
    title: "Kubernetes CKAD Practice Test",
    category: "Containers",
    certification: "Kubernetes",
    creator: "Yatri Cloud",
    enrollments: 8200,
    rating: 4.9,
    udemyUrl: "https://www.udemy.com/course/ckad-practice-test/",
    thumbnail: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=225&fit=crop"
  },
  {
    id: "6",
    title: "AI-900 Azure AI Fundamentals Practice",
    category: "Artificial Intelligence",
    certification: "AI",
    creator: "Yatri Cloud",
    enrollments: 6100,
    rating: 4.5,
    udemyUrl: "https://www.udemy.com/course/ai-900-practice/",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop"
  }
];

export const categories = ["All", "AWS", "Azure", "DevOps", "Terraform", "Kubernetes", "AI"];
