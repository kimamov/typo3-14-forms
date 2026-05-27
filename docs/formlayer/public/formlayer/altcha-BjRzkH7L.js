//#region src/typo3/plugins/altcha.ts
var e = class {
	host;
	widget = null;
	liveRegion = null;
	abortController = new AbortController();
	async init(e, t) {
		this.host = t, await import("altcha"), await this.loadI18n();
		let n = this.resolveChallenge(t);
		this.widget = document.createElement("altcha-widget"), n && this.widget.setAttribute("challenge", n), this.widget.setAttribute("auto", "onfocus"), this.widget.setAttribute("hidelogo", "true"), this.widget.setAttribute("hidefooter", "true"), this.widget.setAttribute("name", `_altcha_internal_${t.name}`);
		let r = this.detectLanguage();
		r && this.widget.setAttribute("language", r), this.liveRegion = document.createElement("span"), this.liveRegion.setAttribute("aria-live", "polite"), this.liveRegion.setAttribute("aria-atomic", "true"), this.liveRegion.className = "visually-hidden";
		let i = document.createElement("div");
		i.className = "altcha-container", i.append(this.widget, this.liveRegion), t.inputElement.insertAdjacentElement("afterend", i), this.bind();
	}
	destroy() {
		this.abortController.abort();
		let e = this.widget?.closest(".altcha-container");
		this.widget = null, this.liveRegion = null, e?.remove();
	}
	bind() {
		if (!this.widget) return;
		let e = this.abortController.signal;
		this.widget.addEventListener("statechange", (e) => {
			let t = e.detail;
			t && (this.announceState(t.state), t.state === "verified" && t.payload ? this.host.setValue(t.payload) : this.host.setValue(""));
		}, { signal: e }), this.widget.addEventListener("verified", (e) => {
			let t = e.target;
			if (!(t instanceof HTMLElement)) return;
			let n = t.querySelector("input[type=\"checkbox\"]");
			n && (n.disabled = !0);
		}, { signal: e });
	}
	announceState(e) {
		if (!(!this.liveRegion || !this.widget)) {
			try {
				if (typeof this.widget.getConfiguration == "function") {
					let t = this.widget.getConfiguration().strings ?? {};
					this.liveRegion.textContent = t[e] ?? "";
					return;
				}
			} catch {}
			this.liveRegion.textContent = "";
		}
	}
	resolveChallenge(e) {
		return e.inputElement.getAttribute("data-altcha-challenge");
	}
	detectLanguage() {
		let e = document.documentElement.lang;
		return e ? e.split("-")[0].toLowerCase() : null;
	}
	async loadI18n() {
		let e = this.detectLanguage();
		if (!(!e || e === "en")) try {
			await import(`altcha/i18n/${e}`);
		} catch {}
	}
};
//#endregion
export { e as default };
