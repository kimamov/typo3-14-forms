//#region src/forms/plugins/combobox.ts
var e = class {
	host;
	select;
	options = [];
	root;
	input;
	listbox;
	toggle;
	activeIndex = -1;
	isOpen = !1;
	filteredOptions = [];
	abortController = new AbortController();
	async init(e, t) {
		this.host = t;
		let n = e.querySelector("select");
		n && (this.select = n, this.options = Array.from(n.options).filter((e) => e.value !== "").map((e) => ({
			value: e.value,
			label: e.textContent?.trim() ?? e.value
		})), this.filteredOptions = [...this.options], this.buildDOM(e), this.syncFromSelect(), this.bind());
	}
	destroy() {
		this.abortController.abort(), this.select && (this.select.hidden = !1, this.select.removeAttribute("tabindex"), this.select.removeAttribute("aria-hidden")), this.root?.remove();
	}
	buildDOM(e) {
		let t = this.select.id || `cb-${this.host.name}`;
		this.select.hidden = !0, this.select.setAttribute("tabindex", "-1"), this.select.setAttribute("aria-hidden", "true"), this.root = document.createElement("div"), this.root.className = "combobox", this.input = document.createElement("input"), this.input.type = "text", this.input.className = "combobox-input", this.input.setAttribute("role", "combobox"), this.input.setAttribute("aria-autocomplete", "list"), this.input.setAttribute("aria-expanded", "false"), this.input.setAttribute("aria-controls", `${t}-listbox`), this.input.setAttribute("aria-haspopup", "listbox"), this.input.setAttribute("autocomplete", "off");
		let n = e.querySelector("label");
		if (n) {
			let e = n.id || `${t}-label`;
			n.id = e, this.input.setAttribute("aria-labelledby", e);
		}
		this.toggle = document.createElement("button"), this.toggle.type = "button", this.toggle.className = "combobox-toggle", this.toggle.setAttribute("aria-label", "Toggle options"), this.toggle.setAttribute("tabindex", "-1"), this.toggle.innerHTML = "<svg width=\"12\" height=\"8\" viewBox=\"0 0 12 8\" aria-hidden=\"true\"><path d=\"M1 1l5 5 5-5\" stroke=\"currentColor\" stroke-width=\"1.5\" fill=\"none\"/></svg>", this.listbox = document.createElement("ul"), this.listbox.id = `${t}-listbox`, this.listbox.className = "combobox-listbox", this.listbox.setAttribute("role", "listbox"), this.listbox.hidden = !0, this.renderOptions();
		let r = document.createElement("div");
		r.className = "combobox-input-wrap", r.append(this.input, this.toggle), this.root.append(r, this.listbox), this.select.insertAdjacentElement("afterend", this.root), this.host.replaceInput(this.input);
	}
	bind() {
		let e = this.abortController.signal;
		this.input.addEventListener("input", () => this.onInput(), { signal: e }), this.input.addEventListener("keydown", (e) => this.onKeydown(e), { signal: e }), this.input.addEventListener("focus", () => this.open(), { signal: e }), this.input.addEventListener("blur", (e) => this.onBlur(e), { signal: e }), this.toggle.addEventListener("mousedown", (e) => {
			e.preventDefault(), this.isOpen ? this.close() : this.open(), this.input.focus();
		}, { signal: e }), this.listbox.addEventListener("mousedown", (e) => {
			e.preventDefault();
			let t = e.target.closest("[role=\"option\"]");
			t && this.selectOption(t.dataset.value ?? "");
		}, { signal: e });
	}
	onInput() {
		let e = this.input.value.toLowerCase().trim();
		this.filteredOptions = e ? this.options.filter((t) => t.label.toLowerCase().includes(e)) : [...this.options], this.activeIndex = -1, this.renderOptions(), this.open();
	}
	onKeydown(e) {
		switch (e.key) {
			case "ArrowDown":
				if (e.preventDefault(), !this.isOpen) {
					this.open();
					return;
				}
				this.moveActive(1);
				break;
			case "ArrowUp":
				if (e.preventDefault(), !this.isOpen) {
					this.open();
					return;
				}
				this.moveActive(-1);
				break;
			case "Enter":
				e.preventDefault(), this.isOpen && this.activeIndex >= 0 && this.selectOption(this.filteredOptions[this.activeIndex].value);
				break;
			case "Escape":
				this.isOpen && (e.preventDefault(), this.close());
				break;
			case "Home":
				this.isOpen && (e.preventDefault(), this.setActive(0));
				break;
			case "End":
				this.isOpen && (e.preventDefault(), this.setActive(this.filteredOptions.length - 1));
				break;
		}
	}
	onBlur(e) {
		let t = e.relatedTarget;
		this.root.contains(t) || (this.close(), this.commitInputValue());
	}
	commitInputValue() {
		let e = this.input.value.trim().toLowerCase(), t = this.options.find((t) => t.label.toLowerCase() === e);
		if (t) this.applySelection(t);
		else if (e === "") this.select.value = "", this.host.setValue("");
		else {
			let e = this.options.find((e) => e.value === this.select.value);
			this.input.value = e?.label ?? "";
		}
	}
	open() {
		this.isOpen || (this.isOpen = !0, this.listbox.hidden = !1, this.input.setAttribute("aria-expanded", "true"));
	}
	close() {
		this.isOpen && (this.isOpen = !1, this.listbox.hidden = !0, this.input.setAttribute("aria-expanded", "false"), this.input.removeAttribute("aria-activedescendant"), this.activeIndex = -1, this.clearActiveDescendant());
	}
	selectOption(e) {
		let t = this.options.find((t) => t.value === e);
		t && (this.applySelection(t), this.close(), this.input.focus());
	}
	applySelection(e) {
		this.input.value = e.label, this.select.value = e.value, this.host.setValue(e.value), this.filteredOptions = [...this.options], this.renderOptions();
	}
	moveActive(e) {
		let t = this.filteredOptions.length;
		if (t === 0) return;
		let n = this.activeIndex + e;
		n < 0 && (n = t - 1), n >= t && (n = 0), this.setActive(n);
	}
	setActive(e) {
		this.activeIndex = e, this.listbox.querySelectorAll("[role=\"option\"]").forEach((t, n) => {
			let r = n === e;
			t.setAttribute("aria-selected", String(r)), r && (this.input.setAttribute("aria-activedescendant", t.id), t.scrollIntoView({ block: "nearest" }));
		});
	}
	clearActiveDescendant() {
		this.listbox.querySelectorAll("[aria-selected=\"true\"]").forEach((e) => {
			e.setAttribute("aria-selected", "false");
		});
	}
	renderOptions() {
		let e = this.select.value, t = this.listbox.id;
		this.listbox.innerHTML = this.filteredOptions.length === 0 ? "<li class=\"combobox-no-results\" role=\"presentation\">No results</li>" : this.filteredOptions.map((n, r) => {
			let i = n.value === e;
			return `<li id="${t}-opt-${r}" role="option" aria-selected="${i}" data-value="${this.escapeAttr(n.value)}" class="combobox-option${i ? " is-selected" : ""}">${this.escapeHtml(n.label)}</li>`;
		}).join("");
	}
	syncFromSelect() {
		let e = this.select.value, t = this.options.find((t) => t.value === e);
		this.input.value = t?.label ?? "";
	}
	escapeHtml(e) {
		let t = document.createElement("div");
		return t.textContent = e, t.innerHTML;
	}
	escapeAttr(e) {
		return e.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
	}
};
//#endregion
export { e as default };
