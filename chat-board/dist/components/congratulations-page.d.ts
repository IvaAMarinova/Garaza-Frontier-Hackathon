import { Goal } from "../lib/types";
interface CongratulationsPageProps {
    goal: Goal | null;
    initialText?: string;
    onClose: () => void;
    isDarkMode?: boolean;
}
export default function CongratulationsPage({ goal, initialText: _initialText, onClose, isDarkMode }: CongratulationsPageProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=congratulations-page.d.ts.map