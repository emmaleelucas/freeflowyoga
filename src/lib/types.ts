export type YogaClass = {
  id: number;
  className: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  instructorName: string;
  matsProvided: boolean;
  classDescription: string;
  isCancelled?: boolean;
  location?: {
    room: string;
    building: string;
    address: string;
  };
};
