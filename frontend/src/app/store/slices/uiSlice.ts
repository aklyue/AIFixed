import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  isMiniPreview: boolean;
}

const initialState: UIState = {
  isMiniPreview: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setMiniPreview(state, action: PayloadAction<boolean>) {
      state.isMiniPreview = action.payload;
    },
  },
});

export const { setMiniPreview } = uiSlice.actions;
export default uiSlice.reducer;
