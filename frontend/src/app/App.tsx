import React from "react";
import "./styles/index.css";
import "./styles/App.css";
import { ErrorBoundary } from "./providers/ErrorBoundary";
import { ReduxProvider } from "./providers/ReduxProvider";
import { RouterProvider } from "./providers/RouterProvider";
import { ThemeProvider } from "./providers/ThemeProvider";

function App() {
  return (
    <ErrorBoundary>
      <ReduxProvider>
        <ThemeProvider>
          <RouterProvider />
        </ThemeProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}

export default App;
