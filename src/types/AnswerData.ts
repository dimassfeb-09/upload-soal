
export type AnswerData = {
    id: number;
    question: string;
    answer: string;
    source: string;
    correct_counts: number,
    incorrect_counts: number;
    created_at: string;
    option: string[];
}
