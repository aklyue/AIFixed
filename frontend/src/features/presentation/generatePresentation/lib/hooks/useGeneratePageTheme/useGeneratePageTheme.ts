import { useSelector } from "react-redux";
import type { RootState } from "../../../../../../app/store";
import { selectActivePresentationTheme } from "../../../../../../entities/presentation";

export const useGeneratePageTheme = () =>
  useSelector((state: RootState) => selectActivePresentationTheme(state));
