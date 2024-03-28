import React from "react";
import ReactDOM from "react-dom";
import { RecoilRoot } from "recoil";
import { Provider } from "react-redux";
import configureStore from "./store";
import App from "./pages/App";
import "./styles-blueprint.css";
import "./styles.css";

const store = configureStore();

ReactDOM.render(
  <RecoilRoot>
    <Provider store={store}>
      <App />
    </Provider>
  </RecoilRoot>,
  document.getElementById("root")
);
