const c = [
	() => import("..\\..\\..\\src\\routes\\__layout.svelte"),
	() => import("..\\components\\error.svelte"),
	() => import("..\\..\\..\\src\\routes\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\projects.svelte"),
	() => import("..\\..\\..\\src\\routes\\music.svelte"),
	() => import("..\\..\\..\\src\\routes\\other.svelte"),
	() => import("..\\..\\..\\src\\routes\\art.svelte")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/index.svelte
	[/^\/$/, [c[0], c[2]], [c[1]]],

	// src/routes/projects.svelte
	[/^\/projects\/?$/, [c[0], c[3]], [c[1]]],

	// src/routes/music.svelte
	[/^\/music\/?$/, [c[0], c[4]], [c[1]]],

	// src/routes/other.svelte
	[/^\/other\/?$/, [c[0], c[5]], [c[1]]],

	// src/routes/art.svelte
	[/^\/art\/?$/, [c[0], c[6]], [c[1]]]
];

// we import the root layout/error components eagerly, so that
// connectivity errors after initialisation don't nuke the app
export const fallback = [c[0](), c[1]()];