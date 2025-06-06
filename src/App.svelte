<script>
	import { onMount } from "svelte";
	import { writable } from "svelte/store";

	import M from "materialize-css";

	let url = writable("");
	let v;
	let start;
	let modalInstance;
	let fullPage = localStorage["fullPage"] == "true" || false;
	let innerWidth;
	let innerHeight;

	const clearInput = () => {
		$url = "";
	};
	const toggleFullPage = () => {
		fullPage = !fullPage;
		localStorage["fullPage"] = (fullPage? "true": "false");
	};
	const autoClipboard = async () => {
		let clipboardText = await navigator.clipboard.readText();

		if(clipboardText.startsWith("https://www.youtube.com/") || clipboardText.startsWith("https://youtu.be/")) {
			url.set(clipboardText);
		}
	};
	const alertAutoClipboard = async () => {
		let clipboardText = await navigator.clipboard.readText();

		if(clipboardText && (clipboardText.startsWith("https://www.youtube.com/") || clipboardText.startsWith("https://youtu.be/")) && ($url != clipboardText)) {
			modalInstance?.open();
		}
	};
	const modal = (el, param) => {
		modalInstance = M.Modal.init(el, {
			"opacity": 0, 
			"inDuration": 100, 
			"outDuration": 100, 
			"dismissible": true
		});

		return {
			destroy() {
				modalInstance?.destroy();
			}
		};
	};

	url.subscribe((value) => {
		let protocolList = ["http://", "https://"];
		let flag = false;
		let queryParams = [];
		if(value.indexOf("?") > -1) {
			queryParams = [ ...value.substring(value.indexOf("?") + 1)?.split("&") ]
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
		start = queryParams.find(item => item.startsWith("t="))?.substring("t=".length).replaceAll(/[^0-9]*/gi, "");
	});

	onMount(async () => {
		if(!$url) {
			autoClipboard();
		}
	});

	Object.defineProperty(window, "eval", {
		value: () => { throw new Error("eval is blocked."); },
		writable: false,
		configurable: false
	});
</script>

<svelte:window on:focus={alertAutoClipboard} bind:innerWidth={innerWidth} bind:innerHeight={innerHeight} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-invalid-attribute -->
<nav class="col s12">
	<div class="nav-wrapper">
		<form class="col s12 {fullPage? "": "container"}" on:submit={ () => { return false; } }>
			<div class="input-field">
				<input id="search" type="search" required bind:value={$url} />
				<label class="label-icon" for="search">
					<a href="javascript:void(0)" title="{fullPage? "Reduce video player to 1280px or normal size": "Expand video player to maximum of html body"}" on:click={toggleFullPage}><i class="material-icons">{fullPage? "fullscreen_exit": "fullscreen"}</i></a>
				</label>
				<i class="material-icons text-primary" on:click={clearInput}>close</i>
			</div>
		</form>
	</div>
</nav>
<div class="col s12 {fullPage? "": "container"}">
	{#if !fullPage || $url == ""}
	<blockquote class="col s12">
		<h1 class="text-primary">Youvanced</h1>
		<p class="text-primary">
			Please use with browser plugin "AdGuard".<br/>
			Youtube has no rights on this site. therefore you can any video without ad correctly.
		</p>
	</blockquote>
	<br />
	<div class="divider" />
	<br />
	{/if}
	{#if v != null && v.length == 11 }
	<div class="col s12 video-container">
		<iframe
			width="{innerWidth}"
			height="{innerHeight}"
			src="https://www.youtube-nocookie.com/embed/{v + (start? "?start=" + start: "")}"
			title="YouTube video player"
			frameborder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
		></iframe>
	</div>
	{/if}
</div>
<!-- svelte-ignore a11y-invalid-attribute -->
<div class="modal bottom-sheet" use:modal style="background-color: #333;">
    <div class="modal-content white-text">
		<h4>Detected other Youtube url</h4>
		<p>load now?</p>
    </div>
    <div class="modal-footer" style="background-color: #333;">
		<a href="javascript:void(0);" class="btn-flat waves-effect modal-close" on:click={autoClipboard}>Load</a>
    </div>
</div>