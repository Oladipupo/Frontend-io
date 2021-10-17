import preprocess from 'svelte-preprocess';
import begin from '@architect/sveltekit-adapter';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess({
        postcss: true
    })],

	kit: {
		adapter: begin(),
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte'
		
	}
};

export default config;
