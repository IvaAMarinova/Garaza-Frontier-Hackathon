import { GoalResponse } from "../lib/api";
interface CongratulationsPageProps {
    goal: GoalResponse | null;
    initialText?: string;
    onClose: () => void;
    isDarkMode?: boolean;
}
export default function CongratulationsPage({ goal, initialText: _initialText, onClose, isDarkMode, }: CongratulationsPageProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=congratulations-page.d.ts.map