import contentCollections from "@content-collections/vite";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		devtools(),
		contentCollections(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		viteReact(),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-radix": ["radix-ui"],
					"vendor-tanstack": [
						"@tanstack/react-query",
						"@tanstack/react-router",
					],
				},
			},
		},
	},
});

export default config;
