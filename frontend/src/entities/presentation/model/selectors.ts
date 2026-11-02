import type { Theme } from "../../../shared/types";

interface PresentationSelectorState {
  editor: {
    availableThemes: Theme[];
    globalThemeId: string;
  };
}

export const selectActivePresentationTheme = (
  state: PresentationSelectorState
) =>
  state.editor.availableThemes.find(
    (theme) => theme.id === state.editor.globalThemeId
  );
