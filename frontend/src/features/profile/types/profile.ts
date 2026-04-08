export type UserProfileUpsertRequest = {
  user_id: string;
  name: string;
  interests_text: string;
  skills: string[];
};

export type UserProfileResponse = {
  user_id: string;
  name: string;
  interests_text: string;
  interests_embedding: number[] | null;
  embedding_model: string | null;
  skills: string[];
  created_at: string | null;
  updated_at: string | null;
};
