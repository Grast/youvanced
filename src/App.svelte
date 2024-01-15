<script>
	import { writable } from "svelte/store";

	let url = writable("");
	let v;

	const isValidId = () => v != null && v.length == 11;

	const clearInput = () => {
		$url = "";
	};

	url.subscribe((value) => {
		let protocolList = ["http://", "https://"];
		let flag = false;

		for (let protocol of protocolList) {
			if (value.startsWith(protocol)) {
				value = value.substring(protocol.length);
				flag = true;
			}
		}

		if(!flag) {
			return false;
		}
		flag = false;

		let prefixList = ["www.youtube.com/watch?v=", "youtu.be/"];

		for (let prefix of prefixList) {
			if (value.startsWith(prefix)) {
				value = value.substring(prefix.length);
				flag = true;
			}
		}

		if(!flag) {
			return false;
		}

		value = value.substring(0, 11);

		v = value;
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<nav class="col s12">
	<div class="nav-wrapper">
		<form class="col s12 container" on:submit={ () => { return false; } }>
			<div class="input-field">
				<input id="search" type="search" required bind:value={$url} />
				<label class="label-icon" for="search">
					<i class="material-icons">search</i>
				</label>
				<i class="material-icons text-primary" on:click={clearInput}>close</i>
			</div>
		</form>
	</div>
</nav>
<div class="col s12 container">
	<blockquote class="col s12">
		<h1 class="text-primary">Youvanced</h1>
		<p class="text-primary">
			How to enjoy youtube video with AdBlock without being zombie pc of Google as your PC<br/>
			We won't hope to attack AdBlock and AdGuard Service as DDoS
		</p>
	</blockquote>
	<br />
	<div class="divider" />
	<br />
	{#if v != null && v.length == 11 }
	<iframe
		width="1280"
		height="720"
		src="https://www.youtube.com/embed/{v}"
		title="YouTube video player"
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		allowfullscreen
	></iframe>
	{/if}
</div>
