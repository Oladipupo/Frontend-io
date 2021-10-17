<script>
  import { fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  function typewriter(node, { speed = 1 }) {
		const valid = (
			node.childNodes.length === 1 &&
			node.childNodes[0].nodeType === Node.TEXT_NODE
		);

		if (!valid) {
			throw new Error(`This transition only works on elements with a single text node child`);
		}

		const text = node.textContent;
		const duration = text.length / (speed * 0.005);

		return {
			duration,
			tick: t => {
				const i = ~~(text.length * t);
				node.textContent = text.slice(0, i);
			}
		};
	}
</script>

<div>
  <h1 in:typewriter>Hey</h1><h1 class="blink_me">|</h1>
</div>
<style>
    h1 {
      color: #FFFFFF;
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
      font-size: 4rem;
      font-weight: 100;
      line-height: 1.1;
    }
    div{
        display: flex;
        background-color: black;
        justify-content: center;
        align-items: center;
        height: 125px;
        width: 100%;
    }
    .blink_me {
      animation: blinker 1s linear infinite;
    }

    @keyframes blinker {
      50% {
      opacity: 0;
    }
}
    :root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, 'Courier New', monospace;
      background-color: black;
    }
</style>