import { configureStore } from "@reduxjs/toolkit";
import {
  authReducer,
  editorReducer,
  markdownReducer,
  promptReducer,
  uiReducer,
} from "../../entities";
import { middlewareOptions } from "./middleware/middlewareOptions";

export const store = configureStore({
  reducer: {
    editor: editorReducer,
    markdown: markdownReducer,
    prompt: promptReducer,
    ui: uiReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(middlewareOptions),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
