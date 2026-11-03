import { useSelector } from "react-redux";
import type { RootState } from "../../../../../../app/store";
import { selectPromptLoading } from "../../../../../../entities";

export const usePromptPageLoading = () =>
  useSelector((state: RootState) => selectPromptLoading(state));
