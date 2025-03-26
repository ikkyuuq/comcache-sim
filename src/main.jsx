import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./styles.css";
import App from "./App.jsx";
import AccessScreen from "./pages/AccessScreen.jsx";

createRoot(document.getElementById("root")).render(
	<BrowserRouter>
		<Routes>
			<Route element={<App />}>
				<Route path="/" element={<AccessScreen />} />
			</Route>
		</Routes>
	</BrowserRouter>,
);
