export type TutorMessageStatus = "answered" | "no_answer";

export interface TutorCitation {
  documentId: string;
  documentName: string;
  page: number;
  excerpt: string;
}

export interface TutorMessageRequest {
  message: string;
}

export interface TutorMessageResponse {
  messageId: string;
  status: TutorMessageStatus;
  answer: string;
  citations: TutorCitation[];
}

export interface TutorHistoryMessage {
  id: string;
  role: "student" | "assistant";
  text: string;
  createdAt: string;
}

export interface TutorChatMessage {
  id: string;
  role: "student" | "assistant";
  text: string;
  status?: TutorMessageStatus;
  citations?: TutorCitation[];
  failed?: boolean;
  pending?: boolean;
}
