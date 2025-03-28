import React from "react";
import { Outlet } from "react-router";

function App() {
	return (
		<div className="min-h-screen bg-[#EFEFEF]">
			{/* Header */}
			<header className="bg-white px-8 py-4">
				<nav className="justify-between flex items-center">
					<div>
						<h1 className="font-bold">COMCACHE</h1>
					</div>
				</nav>
			</header>
			{/* Main */}
			<div className="px-24 py-8 flex flex-col gap-2">
				<Outlet />
			</div>
		</div>
	);
}

export default App;
