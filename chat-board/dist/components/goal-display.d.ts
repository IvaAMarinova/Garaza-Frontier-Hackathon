import { GoalResponse } from "../lib/api";
interface GoalDisplayProps {
    goal: GoalResponse | null;
    onFinish: () => void;
    isDarkMode?: boolean;
}
export default function GoalDisplay({ goal, onFinish, isDarkMode, }: GoalDisplayProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=goal-display.d.ts.map