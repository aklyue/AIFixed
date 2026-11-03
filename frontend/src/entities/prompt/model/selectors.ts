interface PromptSelectorState {
  prompt: {
    loading: boolean;
  };
}

export const selectPromptLoading = (state: PromptSelectorState) =>
  state.prompt.loading;
