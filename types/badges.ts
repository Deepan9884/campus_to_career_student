export type BadgeId =
    | "First Steps"
    | "Resume Ready"
    | "Interview Warmup"
    | "Interview Pro"
    | "Code Explorer"
    | "Gap Closer"
    | "Roadmap Builder"
    | "Quiz Streak"
    | "High Scorer";

export type EarnedBadge = {
    _id: string;
    userId: string;
    badgeId: BadgeId;
    earnedAt: string;
};

export type BadgesResponse = {
    success: boolean;
    data: {
        badges: EarnedBadge[];
    };
};
