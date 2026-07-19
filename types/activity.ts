export type ActivityModule =
  | "resume"
  | "interview"
  | "github"
  | "skill_gap"
  | "roadmap"
  | "quiz";

export interface ActivityLogEntry {
  _id: string;
  user: string;
  module: ActivityModule;
  action: string;
  summary: string;
  relatedResourceId: string;
  relatedResourceType: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedActivityResponse {
  activities: ActivityLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityApiParams {
  page?: number;
  limit?: number;
  module?: ActivityModule;
}