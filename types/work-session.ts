export interface WorkSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  tasks: Task[];
  totalDuration: number; // 밀리초 단위
}

export interface Task {
  id: string;
  content: string;
  startTime: Date;
  endTime?: Date;
  sessionId?: string;
}
