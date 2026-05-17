export type UpdateProfileDto = {
  full_name: string;
  city: string;
  country: string;
  country_code: string;
  phone_number: string;
  phone_country_code: string | null;
  security_review_required: boolean;
  avatar_url: string | null;
  email: string;
};
