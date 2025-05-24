export type UserType = 'talent' | 'organizer';

export interface NavBarProps {
  token: string;
  userType: UserType;
  setToken: (token: string) => void;
  setUserType: (userType: UserType) => void;
}

export interface LoginProps {
  setToken: (token: string | null) => void;
  setUserType: (userType: string | null) => void;
}

export interface RegisterProps {
  setToken: (token: string | null) => void;
  setUserType: (userType: string | null) => void;
}

export interface Faculty {
  id: number;
  name: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  short_description: string;
  image?: string;
  date: string;
  location: string;
  organizer: Organizer;
  status: string;
  created_at: string;
  updated_at: string;
  faculties?: Faculty[];
  required_skills?: string;
  faculty_restriction?: boolean;
  organization_name?: string;
  applications_count?: number;
}

export interface Organizer {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  position: string;
  bio: string;
}

export interface Talent {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  skills: string[];
  preferences: string[];
  bio: string;
  faculty: Faculty;
  education_level: string;
  course: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

export interface Profile {
  id: number;
  user: User;
  skills: string;
  preferences: string;
  bio: string;
  avatar?: string;
  faculty?: Faculty;
  education_level_display?: string;
  course?: number;
}

export type EducationLevel = 'bachelor' | 'master' | 'specialist';

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  skills: string;
  preferences: string;
  bio: string;
  faculty_id: string;
  education_level: EducationLevel | '';
  course: string;
}

export interface RegisterResponse {
  token: string;
  userType: UserType;
}

export interface OrganizerProfile {
  id: number;
  user: User;
  organization_name: string;
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface Application {
  id: number;
  event: Event;
  talent: Talent;
  status: string;
  created_at: string;
  updated_at: string;
}

export type EventStatus = 'draft' | 'published' | 'closed' | 'cancelled';

export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type EventsResponse = ApiResponse<Event>;
export type ApplicationsResponse = ApiResponse<Application>;
export type OrganizerProfilesResponse = ApiResponse<OrganizerProfile>;

export interface ApplicationFormData {
  event_id: number;
  message: string;
}

export interface ApplicationResponse {
  id: number;
  event: Event;
  user: User;
  talent_profile: Profile;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  organizer_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description: string;
  required_skills: string;
  date: string;
  location: string;
  image: File | null;
  status: EventStatus;
  faculty_restriction: boolean;
  faculty_ids: string[];
}

export interface EventFormResponse {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  image?: string;
  status: EventStatus;
  faculty_restriction: boolean;
  faculties: Faculty[];
  required_skills?: string;
}

export interface Recommendation {
  id: number;
  event: Event;
  score: number;
  reason: string;
}

export type RecommendationsResponseType = ApiResponse<Recommendation>;

export interface AuthResponse {
  token: string;
  user: User;
}
