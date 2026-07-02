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
