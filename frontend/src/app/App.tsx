import React from "react";
import "./App.css";
import { AiChat, AppRouter } from "../features";
import { Theme } from "../shared/types/markdownTypes";
import { useSelector } from "react-redux";
import { RootState } from "./store";

function App() {
  return <AppRouter />;
}

export default App;
