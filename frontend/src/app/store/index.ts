import { configureStore } from "@reduxjs/toolkit";
import editorReducer from "./slices/editorSlice";
import markdownReducer from "./slices/markdownSlice";
import promptReducer from "./slices/promptSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    markdown: markdownReducer,
    prompt: promptReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["prompt.file"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
