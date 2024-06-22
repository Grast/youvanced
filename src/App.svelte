<script>
	import { writable } from "svelte/store";

	let url = writable("");
	let v;
	let start;

	const clearInput = () => {
		$url = "";
	};
	const pasteClipboard = () => {
		navigator.clipboard.readText().then(text => url.set(text));
	};

	url.subscribe((value) => {
		let protocolList = ["http://", "https://"];
		let flag = false;
		let querystring = [];
		if(value.indexOf("?") > -1) {
			querystring = [ ...value.substring(value.indexOf("?") + 1)?.split("&") ]
		}

		for (let protocol of protocolList) {
			if (value.startsWith(protocol)) {
				value = value.substring(protocol.length);
				flag = true;
			}
		}

		if(!flag) {
			v = null;
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
			v = null;
			return false;
		}

		value = value.substring(0, 11);

		v = value;
		start = querystring.find(item => item.startsWith("t="))?.substring("t=".length).replaceAll(/[^0-9]*/gi, "");
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-invalid-attribute -->
<nav class="col s12">
	<div class="nav-wrapper">
		<form class="col s12 container" on:submit={ () => { return false; } }>
			<div class="input-field">
				<input id="search" type="search" required bind:value={$url} />
				<label class="label-icon" for="search">
					<a href="javascript:void(0)" title="Paste Youtube Video Url From Clipboard (Need Browser Permission)" on:click={pasteClipboard}><i class="material-icons">search</i></a>
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
			We against youtube's rude behavior that ignoring each country's ad reivew policy calling &quot;Global One Build&quot;.<br/>
			Youtube must follow to ad review policy of each country even if all policy were different on each country.
		</p>
	</blockquote>
	<br />
	<div class="divider" />
	<br />
	{#if v != null && v.length == 11 }
	<div class="col s12 video-container">
		<iframe
			width="1280"
			height="720"
			src="https://www.youtube-nocookie.com/embed/{v + (start? "?start=" + start: "")}"
			title="YouTube video player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
		></iframe>
	</div>
	{/if}
</div>
