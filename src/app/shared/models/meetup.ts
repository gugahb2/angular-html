export interface Meetup {
    name: string;
    description: string;
    isPublic: boolean;
    owner: object;
    hasJoiningQuestions: boolean;
    joiningQuestions: object;
    createdAt: string;
}
