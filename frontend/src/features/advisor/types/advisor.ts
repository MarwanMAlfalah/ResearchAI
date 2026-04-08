export type AdvisorSupportingItem = {
  item_type: string;
  title: string;
  details: Record<string, unknown>;
};

export type AdvisorChatRequest = {
  user_id: string;
  message: string;
};

export type AdvisorChatResponse = {
  user_id: string;
  detected_intent: string;
  answer: string;
  supporting_items: AdvisorSupportingItem[];
};

export type AdvisorMessage = {
  id: string;
  role: "user" | "advisor";
  text: string;
  detectedIntent?: string;
  supportingItems?: AdvisorSupportingItem[];
  createdAt: string;
};
