import { respond } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths, assets } from './runtime/paths.js';
import { set_prerendering } from './runtime/env.js';
import * as user_hooks from "./hooks.js";

const template = ({ head, body }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"/favicon.png\" />\n\t\t<link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css\" rel=\"stylesheet\" integrity=\"sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU\" crossorigin=\"anonymous\">\n\t\t<link rel=\"stylesheet\" href=\"stylesheets/main.css\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/js/bootstrap.bundle.min.js\" integrity=\"sha384-/bQdsTh/da6pkI1MST/rWKFNjaCP5gBSY4sEBT38Q/9RBh9AH40zEOg7Hlq2THRZ\" crossorigin=\"anonymous\"></script>\n\t\t<div style=\"justify-content: center;\" id=\"svelte\">" + body + "</div>\n\t</body>\n</html>\n\n";

let options = null;

const default_settings = { paths: {"base":"","assets":""} };

// allow paths to be overridden in svelte-kit preview
// and in prerendering
export function init(settings = default_settings) {
	set_paths(settings.paths);
	set_prerendering(settings.prerendering || false);

	const hooks = get_hooks(user_hooks);

	options = {
		amp: false,
		dev: false,
		entry: {
			file: assets + "/_app/start-6b6fdb05.js",
			css: [assets + "/_app/assets/start-464e9d0a.css"],
			js: [assets + "/_app/start-6b6fdb05.js",assets + "/_app/chunks/vendor-0d868d72.js"]
		},
		fetched: undefined,
		floc: false,
		get_component_path: id => assets + "/_app/" + entry_lookup[id],
		get_stack: error => String(error), // for security
		handle_error: (error, request) => {
			hooks.handleError({ error, request });
			error.stack = options.get_stack(error);
		},
		hooks,
		hydrate: true,
		initiator: undefined,
		load_component,
		manifest,
		paths: settings.paths,
		prerender: true,
		read: settings.read,
		root,
		service_worker: null,
		router: true,
		ssr: true,
		target: "#svelte",
		template,
		trailing_slash: "never"
	};
}

// input has already been decoded by decodeURI
// now handle the rest that decodeURIComponent would do
const d = s => s
	.replace(/%23/g, '#')
	.replace(/%3[Bb]/g, ';')
	.replace(/%2[Cc]/g, ',')
	.replace(/%2[Ff]/g, '/')
	.replace(/%3[Ff]/g, '?')
	.replace(/%3[Aa]/g, ':')
	.replace(/%40/g, '@')
	.replace(/%26/g, '&')
	.replace(/%3[Dd]/g, '=')
	.replace(/%2[Bb]/g, '+')
	.replace(/%24/g, '$');

const empty = () => ({});

const manifest = {
	assets: [{"file":"favicon.png","size":1571,"type":"image/png"}],
	layout: "src/routes/__layout.svelte",
	error: ".svelte-kit/build/components/error.svelte",
	routes: [
		{
						type: 'page',
						pattern: /^\/$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
						b: [".svelte-kit/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/projects\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/projects.svelte"],
						b: [".svelte-kit/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/music\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/music.svelte"],
						b: [".svelte-kit/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/other\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/other.svelte"],
						b: [".svelte-kit/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/art\/?$/,
						params: empty,
						a: ["src/routes/__layout.svelte", "src/routes/art.svelte"],
						b: [".svelte-kit/build/components/error.svelte"]
					}
	]
};

// this looks redundant, but the indirection allows us to access
// named imports without triggering Rollup's missing import detection
const get_hooks = hooks => ({
	getSession: hooks.getSession || (() => ({})),
	handle: hooks.handle || (({ request, resolve }) => resolve(request)),
	handleError: hooks.handleError || (({ error }) => console.error(error.stack)),
	externalFetch: hooks.externalFetch || fetch
});

const module_lookup = {
	"src/routes/__layout.svelte": () => import("..\\..\\src\\routes\\__layout.svelte"),".svelte-kit/build/components/error.svelte": () => import("./components\\error.svelte"),"src/routes/index.svelte": () => import("..\\..\\src\\routes\\index.svelte"),"src/routes/projects.svelte": () => import("..\\..\\src\\routes\\projects.svelte"),"src/routes/music.svelte": () => import("..\\..\\src\\routes\\music.svelte"),"src/routes/other.svelte": () => import("..\\..\\src\\routes\\other.svelte"),"src/routes/art.svelte": () => import("..\\..\\src\\routes\\art.svelte")
};

const metadata_lookup = {"src/routes/__layout.svelte":{"entry":"pages/__layout.svelte-7be65399.js","css":["assets/pages/__layout.svelte-8ee189c1.css"],"js":["pages/__layout.svelte-7be65399.js","chunks/vendor-0d868d72.js"],"styles":[]},".svelte-kit/build/components/error.svelte":{"entry":"error.svelte-84b05a18.js","css":[],"js":["error.svelte-84b05a18.js","chunks/vendor-0d868d72.js"],"styles":[]},"src/routes/index.svelte":{"entry":"pages/index.svelte-820af5ee.js","css":["assets/pages/index.svelte-7777cb9c.css","assets/footer-8107bb67.css"],"js":["pages/index.svelte-820af5ee.js","chunks/vendor-0d868d72.js","chunks/footer-a9ee1005.js","chunks/dbArt-4a6cb934.js","chunks/dbMusic-6f8f906c.js","chunks/dbProjects-73f88bf3.js"],"styles":[]},"src/routes/projects.svelte":{"entry":"pages/projects.svelte-9ca0c8cb.js","css":["assets/pages/projects.svelte-7d2ac603.css","assets/footer-8107bb67.css"],"js":["pages/projects.svelte-9ca0c8cb.js","chunks/vendor-0d868d72.js","chunks/footer-a9ee1005.js","chunks/dbProjects-73f88bf3.js"],"styles":[]},"src/routes/music.svelte":{"entry":"pages/music.svelte-8353becb.js","css":["assets/pages/music.svelte-23dacfaa.css","assets/footer-8107bb67.css"],"js":["pages/music.svelte-8353becb.js","chunks/vendor-0d868d72.js","chunks/footer-a9ee1005.js","chunks/dbMusic-6f8f906c.js"],"styles":[]},"src/routes/other.svelte":{"entry":"pages/other.svelte-a15056f3.js","css":["assets/pages/other.svelte-1ceca582.css","assets/footer-8107bb67.css"],"js":["pages/other.svelte-a15056f3.js","chunks/vendor-0d868d72.js","chunks/footer-a9ee1005.js"],"styles":[]},"src/routes/art.svelte":{"entry":"pages/art.svelte-d620545c.js","css":["assets/pages/art.svelte-cc6c1208.css","assets/footer-8107bb67.css"],"js":["pages/art.svelte-d620545c.js","chunks/vendor-0d868d72.js","chunks/footer-a9ee1005.js","chunks/dbArt-4a6cb934.js"],"styles":[]}};

async function load_component(file) {
	const { entry, css, js, styles } = metadata_lookup[file];
	return {
		module: await module_lookup[file](),
		entry: assets + "/_app/" + entry,
		css: css.map(dep => assets + "/_app/" + dep),
		js: js.map(dep => assets + "/_app/" + dep),
		styles
	};
}

export function render(request, {
	prerender
} = {}) {
	const host = request.headers["host"];
	return respond({ ...request, host }, options, { prerender });
}