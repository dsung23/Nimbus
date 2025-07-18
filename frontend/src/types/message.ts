export interface Message {
  id: string;
  text: string;
  isFromUser: boolean;
  timestamp: Date;
  isError?: boolean;
} 