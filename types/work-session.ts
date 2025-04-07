export interface WorkSession {
  id: string;
  startTime: string;
  endTime?: string;
  tasks: Task[];
  totalDuration: number; // 밀리초 단위
}

export interface Task {
  id: string;
  content: string;
  startTime: string;
  endTime?: string;
  sessionId?: string;
}
