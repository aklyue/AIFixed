import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { create } from "domain";

interface PromptStateProps {
  file: File | null;
  text: string;
  loading: boolean;
}

const initialState: PromptStateProps = {
  file: null,
  text: "",
  loading: false,
};

const promptSlice = createSlice({
  name: "prompt",
  initialState,
  reducers: {
    setPromptSettings: (
      state,
      action: PayloadAction<{ file: File | null; text: string }>
    ) => {
      const { text, file } = action.payload;
      state.text = text;
      state.file = file || null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setPromptSettings, setLoading } = promptSlice.actions;
export default promptSlice.reducer;
