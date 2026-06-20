import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "#/components/ui/sonner";

import "../styles.css";

const queryClient = new QueryClient();

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<Toaster position="bottom-right" richColors />
		</QueryClientProvider>
	);
}
