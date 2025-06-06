
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    // (98:1) {#if v != null && v.length == 11 }
    function create_if_block(ctx) {
    	let div;
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			iframe = element("iframe");
    			attr_dev(iframe, "width", "1280");
    			attr_dev(iframe, "height", "720");
    			if (!src_url_equal(iframe.src, iframe_src_value = "https://www.youtube-nocookie.com/embed/" + (/*v*/ ctx[0] + (/*start*/ ctx[1] ? "?start=" + /*start*/ ctx[1] : "")))) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "YouTube video player");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file, 99, 2, 2656);
    			attr_dev(div, "class", "col s12 video-container");
    			add_location(div, file, 98, 1, 2616);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, iframe);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*v, start*/ 3 && !src_url_equal(iframe.src, iframe_src_value = "https://www.youtube-nocookie.com/embed/" + (/*v*/ ctx[0] + (/*start*/ ctx[1] ? "?start=" + /*start*/ ctx[1] : "")))) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(98:1) {#if v != null && v.length == 11 }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let div1;
    	let form;
    	let div0;
    	let input;
    	let t0;
    	let label;
    	let a;
    	let i0;
    	let t2;
    	let i1;
    	let t4;
    	let div3;
    	let blockquote;
    	let h1;
    	let t6;
    	let p;
    	let t7;
    	let br0;
    	let t8;
    	let t9;
    	let br1;
    	let t10;
    	let div2;
    	let t11;
    	let br2;
    	let t12;
    	let mounted;
    	let dispose;
    	let if_block = /*v*/ ctx[0] != null && /*v*/ ctx[0].length == 11 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div1 = element("div");
    			form = element("form");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			a = element("a");
    			i0 = element("i");
    			i0.textContent = "search";
    			t2 = space();
    			i1 = element("i");
    			i1.textContent = "close";
    			t4 = space();
    			div3 = element("div");
    			blockquote = element("blockquote");
    			h1 = element("h1");
    			h1.textContent = "Youvanced";
    			t6 = space();
    			p = element("p");
    			t7 = text("We against youtube's rude behavior that ignoring each country's ad reivew policy calling \"Global One Build\".");
    			br0 = element("br");
    			t8 = text("\n\t\t\tYoutube must follow to ad review policy of each country even if all policy were different on each country.");
    			t9 = space();
    			br1 = element("br");
    			t10 = space();
    			div2 = element("div");
    			t11 = space();
    			br2 = element("br");
    			t12 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "id", "search");
    			attr_dev(input, "type", "search");
    			input.required = true;
    			add_location(input, file, 77, 4, 1744);
    			attr_dev(i0, "class", "material-icons");
    			add_location(i0, file, 79, 133, 1984);
    			attr_dev(a, "href", "javascript:void(0)");
    			attr_dev(a, "title", "Paste Youtube Video Url From Clipboard (Need Browser Permission)");
    			add_location(a, file, 79, 5, 1856);
    			attr_dev(label, "class", "label-icon");
    			attr_dev(label, "for", "search");
    			add_location(label, file, 78, 4, 1811);
    			attr_dev(i1, "class", "material-icons text-primary");
    			add_location(i1, file, 81, 4, 2042);
    			attr_dev(div0, "class", "input-field");
    			add_location(div0, file, 76, 3, 1714);
    			attr_dev(form, "class", "col s12 container");
    			add_location(form, file, 75, 2, 1640);
    			attr_dev(div1, "class", "nav-wrapper");
    			add_location(div1, file, 74, 1, 1612);
    			attr_dev(nav, "class", "col s12");
    			add_location(nav, file, 73, 0, 1589);
    			attr_dev(h1, "class", "text-primary");
    			add_location(h1, file, 88, 2, 2212);
    			add_location(br0, file, 90, 121, 2400);
    			attr_dev(p, "class", "text-primary");
    			add_location(p, file, 89, 2, 2254);
    			attr_dev(blockquote, "class", "col s12");
    			add_location(blockquote, file, 87, 1, 2181);
    			add_location(br1, file, 94, 1, 2539);
    			attr_dev(div2, "class", "divider");
    			add_location(div2, file, 95, 1, 2547);
    			add_location(br2, file, 96, 1, 2572);
    			attr_dev(div3, "class", "col s12 container");
    			add_location(div3, file, 86, 0, 2148);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			append_dev(div1, form);
    			append_dev(form, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*$url*/ ctx[2]);
    			append_dev(div0, t0);
    			append_dev(div0, label);
    			append_dev(label, a);
    			append_dev(a, i0);
    			append_dev(div0, t2);
    			append_dev(div0, i1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, blockquote);
    			append_dev(blockquote, h1);
    			append_dev(blockquote, t6);
    			append_dev(blockquote, p);
    			append_dev(p, t7);
    			append_dev(p, br0);
    			append_dev(p, t8);
    			append_dev(div3, t9);
    			append_dev(div3, br1);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div3, t11);
    			append_dev(div3, br2);
    			append_dev(div3, t12);
    			if (if_block) if_block.m(div3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "focus", /*autoClipboard*/ ctx[6], false, false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(a, "click", /*pasteClipboard*/ ctx[5], false, false, false, false),
    					listen_dev(i1, "click", /*clearInput*/ ctx[4], false, false, false, false),
    					listen_dev(form, "submit", submit_handler, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url*/ 4 && input.value !== /*$url*/ ctx[2]) {
    				set_input_value(input, /*$url*/ ctx[2]);
    			}

    			if (/*v*/ ctx[0] != null && /*v*/ ctx[0].length == 11) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const submit_handler = () => {
    	return false;
    };

    function instance($$self, $$props, $$invalidate) {
    	let $url;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let url = writable("");
    	validate_store(url, 'url');
    	component_subscribe($$self, url, value => $$invalidate(2, $url = value));
    	let v;
    	let start;

    	const clearInput = () => {
    		set_store_value(url, $url = "", $url);
    	};

    	const pasteClipboard = () => {
    		navigator.clipboard.readText().then(text => url.set(text));
    	};

    	url.subscribe(value => {
    		let protocolList = ["http://", "https://"];
    		let flag = false;
    		let querystring = [];

    		if (value.indexOf("?") > -1) {
    			querystring = [...value.substring(value.indexOf("?") + 1)?.split("&")];
    		}

    		for (let protocol of protocolList) {
    			if (value.startsWith(protocol)) {
    				value = value.substring(protocol.length);
    				flag = true;
    			}
    		}

    		if (!flag) {
    			$$invalidate(0, v = null);
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

    		if (!flag) {
    			$$invalidate(0, v = null);
    			return false;
    		}

    		value = value.substring(0, 11);
    		$$invalidate(0, v = value);
    		$$invalidate(1, start = querystring.find(item => item.startsWith("t="))?.substring(("t=").length).replaceAll(/[^0-9]*/gi, ""));
    	});

    	const autoClipboard = async () => {
    		let clipboardText = await navigator.clipboard.readText();

    		if (clipboardText.startsWith("https://www.youtube.com/") || clipboardText.startsWith("https://youtu.be/")) {
    			url.set(clipboardText);
    		}
    	};

    	onMount(async () => {
    		autoClipboard();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		$url = this.value;
    		url.set($url);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		writable,
    		url,
    		v,
    		start,
    		clearInput,
    		pasteClipboard,
    		autoClipboard,
    		$url
    	});

    	$$self.$inject_state = $$props => {
    		if ('url' in $$props) $$invalidate(3, url = $$props.url);
    		if ('v' in $$props) $$invalidate(0, v = $$props.v);
    		if ('start' in $$props) $$invalidate(1, start = $$props.start);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		v,
    		start,
    		$url,
    		url,
    		clearInput,
    		pasteClipboard,
    		autoClipboard,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
