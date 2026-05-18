import { n as e } from "./datepicker-BGS6ff8f.js";
//#region src/forms/types.ts
var t = {
	errorClass: "is-invalid",
	errorMsgClass: "invalid-feedback",
	descriptionClass: "form-text"
}, n = {
	formField: "[data-form-field]",
	input: "input, select, textarea"
}, r = {
	type: "NotEmpty",
	validate(e, t) {
		let n = e.trim().length > 0;
		return {
			valid: n,
			message: n ? "" : t.message ?? "This field is required."
		};
	}
}, i = {
	type: "StringLength",
	validate(e, t) {
		let n = Number(t.minimum ?? 0), r = Number(t.maximum ?? Infinity), i = t.message, a = e.length;
		return a === 0 ? {
			valid: !0,
			message: ""
		} : a < n ? {
			valid: !1,
			message: i ?? `Must be at least ${n} characters.`
		} : a > r ? {
			valid: !1,
			message: i ?? `Must be at most ${r} characters.`
		} : {
			valid: !0,
			message: ""
		};
	}
}, a = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, o = {
	type: "EmailAddress",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = a.test(e);
		return {
			valid: n,
			message: n ? "" : t.message ?? "Please enter a valid email address."
		};
	}
}, s = {
	type: "RegularExpression",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = String(t.regularExpression ?? "");
		if (!n) return {
			valid: !0,
			message: ""
		};
		let r = n.match(/^\/(.+)\/([gimsuy]*)$/);
		if (!r) return {
			valid: !0,
			message: ""
		};
		try {
			let n = new RegExp(r[1], r[2]).test(e);
			return {
				valid: n,
				message: n ? "" : t.message ?? "The value does not match the expected format."
			};
		} catch {
			return {
				valid: !0,
				message: ""
			};
		}
	}
}, c = {
	type: "NumberRange",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = t.message, r = Number(e);
		if (Number.isNaN(r)) return {
			valid: !1,
			message: n ?? "Please enter a valid number."
		};
		let i = t.minimum == null ? -Infinity : Number(t.minimum), a = t.maximum == null ? Infinity : Number(t.maximum);
		return r < i ? {
			valid: !1,
			message: n ?? `The value must be at least ${i}.`
		} : r > a ? {
			valid: !1,
			message: n ?? `The value must be at most ${a}.`
		} : {
			valid: !0,
			message: ""
		};
	}
}, l = {
	type: "Integer",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = /^-?\d+$/.test(e.trim());
		return {
			valid: n,
			message: n ? "" : t.message ?? "Please enter a whole number."
		};
	}
}, u = {
	type: "Float",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = !Number.isNaN(Number(e.trim())) && e.trim() !== "";
		return {
			valid: n,
			message: n ? "" : t.message ?? "Please enter a valid number."
		};
	}
}, d = {
	type: "Alphanumeric",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = /^[\p{L}\p{N}]*$/u.test(e);
		return {
			valid: n,
			message: n ? "" : t.message ?? "Only letters and numbers are allowed."
		};
	}
}, f = {
	type: "Number",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = !Number.isNaN(Number(e.trim())) && e.trim() !== "";
		return {
			valid: n,
			message: n ? "" : t.message ?? "Please enter a valid number."
		};
	}
}, p = {
	type: "DateTime",
	validate(e) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let t = new Date(e);
		return Number.isNaN(t.getTime()) ? {
			valid: !1,
			message: "Please enter a valid date."
		} : {
			valid: !0,
			message: ""
		};
	}
}, m = {
	type: "DateRange",
	validate(e, t) {
		if (e.length === 0) return {
			valid: !0,
			message: ""
		};
		let n = t.message, r = new Date(e);
		if (Number.isNaN(r.getTime())) return {
			valid: !1,
			message: n ?? "Please enter a valid date."
		};
		let i = t.minimum, a = t.maximum;
		if (i) {
			let e = new Date(i);
			if (!Number.isNaN(e.getTime()) && r < e) return {
				valid: !1,
				message: n ?? `The date must not be before ${i}.`
			};
		}
		if (a) {
			let e = new Date(a);
			if (!Number.isNaN(e.getTime()) && r > e) return {
				valid: !1,
				message: n ?? `The date must not be after ${a}.`
			};
		}
		return {
			valid: !0,
			message: ""
		};
	}
}, h = {
	B: 1,
	K: 1024,
	M: 1024 * 1024,
	G: 1024 * 1024 * 1024
};
function g(e) {
	let t = e.trim().toUpperCase().match(/^(\d+(?:\.\d+)?)\s*([BKMG])?$/);
	return t ? parseFloat(t[1]) * (h[t[2] ?? "B"] ?? 1) : 0;
}
var _ = {
	type: "FileSize",
	validate(e, t) {
		let n = t.__files;
		if (!n || n.length === 0) return {
			valid: !0,
			message: ""
		};
		let r = t.message, i = String(t.minimum ?? "0B"), a = String(t.maximum ?? ""), o = g(i), s = a ? g(a) : Infinity;
		for (let e = 0; e < n.length; e++) {
			let t = n[e];
			if (t.size < o) return {
				valid: !1,
				message: r ?? `File "${t.name}" is too small. Minimum: ${i}.`
			};
			if (t.size > s) return {
				valid: !1,
				message: r ?? `File "${t.name}" is too large. Maximum: ${a}.`
			};
		}
		return {
			valid: !0,
			message: ""
		};
	}
}, v = /* @__PURE__ */ new Map();
function y() {
	b(r), b(i), b(o), b(s), b(c), b(l), b(u), b(d), b(f), b(p), b(m), b(_);
}
function b(e) {
	v.set(e.type, e);
}
function x(e, t, n) {
	let r = [];
	for (let i of e) {
		let e = v.get(i.type);
		if (!e) {
			console.warn(`[FormsModule] Unknown validator type: "${i.type}"`);
			continue;
		}
		let a = {
			...i.options ?? {},
			...n ?? {}
		}, o = e.validate(t, a);
		if (o instanceof Promise) {
			console.warn(`[FormsModule] Async validator "${i.type}" used in sync context — use runValidatorsAsync instead`);
			continue;
		}
		o.valid || r.push(o);
	}
	return r;
}
//#endregion
//#region src/forms/field-controller.ts
var S = [
	"required",
	"pattern",
	"minlength",
	"maxlength",
	"min",
	"max",
	"step"
], C = class {
	name;
	wrapper;
	input;
	errorsEl;
	rules;
	abortController = new AbortController();
	savedNativeAttrs = /* @__PURE__ */ new Map();
	debounceTimer = null;
	_state;
	_enabled = !0;
	onChange = null;
	plugin = null;
	_serverErrors = [];
	_serverErrorValue = null;
	_destroyed = !1;
	fieldListeners = /* @__PURE__ */ new Map();
	options = {};
	constructor(e, t = {}) {
		this.wrapper = e, this.name = e.getAttribute("data-form-field") ?? "";
		let r = e.querySelector(n.input);
		if (!r) throw Error(`[FormsModule] No input found in field "${this.name}"`);
		this.input = r, this.options = t, this.errorsEl = this.findErrorsElement(), this.rules = this.parseRules(), this.disableNativeValidation(), this._state = {
			name: this.name,
			value: this.readValue(),
			isValid: !0,
			isDirty: !1,
			isTouched: !1,
			errors: []
		}, this.bind();
	}
	get state() {
		return { ...this._state };
	}
	get element() {
		return this.wrapper;
	}
	get inputElement() {
		return this.input;
	}
	get fieldType() {
		return this.wrapper.getAttribute("data-field-type") || null;
	}
	get enabled() {
		return this._enabled;
	}
	setEnabled(e) {
		this._enabled !== e && (this._enabled = e, e ? (this.wrapper.hidden = !1, this.wrapper.removeAttribute("aria-hidden"), this.input.disabled = !1, this.wrapper.querySelectorAll(n.input).forEach((e) => {
			e.disabled = !1;
		})) : (this.wrapper.hidden = !0, this.wrapper.setAttribute("aria-hidden", "true"), this.input.disabled = !0, this.wrapper.querySelectorAll(n.input).forEach((e) => {
			e.disabled = !0;
		}), this._state = {
			...this._state,
			isValid: !0,
			errors: []
		}, this.updateDOM(!0, [])), this.notifyChange());
	}
	setChangeCallback(e) {
		this.onChange = e;
	}
	on(e, t) {
		let n = this.fieldListeners.get(e);
		n || (n = /* @__PURE__ */ new Set(), this.fieldListeners.set(e, n)), n.add(t);
	}
	once(e, t) {
		let n = (r) => {
			this.off(e, n), t(r);
		};
		this.on(e, n);
	}
	off(e, t) {
		this.fieldListeners.get(e)?.delete(t);
	}
	emitFieldEvent(e) {
		let t = this.fieldListeners.get(e);
		if (!t) return;
		let n = this.state;
		for (let r of [...t]) try {
			r(n);
		} catch (t) {
			console.error(`[FormsModule] Error in field "${this.name}" "${e}" handler:`, t);
		}
	}
	setValue(e) {
		(this.input instanceof HTMLInputElement || this.input instanceof HTMLTextAreaElement || this.input instanceof HTMLSelectElement) && (this.input.value = e), this._state.value = e, this._state.isDirty = !0, this._state.isTouched = !0, this.validate(), this.notifyChange();
	}
	async attachPlugin(e) {
		this._destroyed || (this.plugin && this.plugin.destroy(), this.plugin = e, await e.init(this.wrapper, this));
	}
	replaceInput(e) {
		this.input = e;
	}
	validate() {
		if (!this._enabled) return {
			isValid: !0,
			errors: []
		};
		let e = this.readValue();
		if (this._serverErrors.length > 0 && e === this._serverErrorValue) return {
			isValid: !1,
			errors: this._serverErrors
		};
		this._serverErrors = [], this._serverErrorValue = null;
		let t = () => {
			let t = {};
			this.input instanceof HTMLInputElement && this.input.type === "file" && (t.__files = this.input.files);
			let n = x(this.rules, e, t).map((e) => e.message);
			return {
				isValid: n.length === 0,
				errors: n
			};
		}, n = this.options.validate ? this.options.validate(e, this.rules, t) : t();
		return this._state = {
			...this._state,
			value: e,
			isValid: n.isValid,
			errors: n.errors
		}, this.updateDOM(n.isValid, n.errors), n;
	}
	setServerErrors(e) {
		let t = this.options.onServerErrors ? this.options.onServerErrors(e, this.name) : e, n = t.length === 0;
		this._serverErrors = t, this._serverErrorValue = n ? null : this.readValue(), this._state = {
			...this._state,
			isValid: n,
			isTouched: !0,
			errors: t
		}, this.updateDOM(n, t), this.notifyChange();
	}
	reset() {
		if (this.input instanceof HTMLInputElement) this.input.type === "checkbox" || this.input.type === "radio" ? this.input.checked = this.input.defaultChecked : this.input.type === "file" ? this.input.value = "" : this.input.value = this.input.defaultValue;
		else if (this.input instanceof HTMLSelectElement) for (let e of Array.from(this.input.options)) e.selected = e.defaultSelected;
		else this.input instanceof HTMLTextAreaElement && (this.input.value = this.input.defaultValue);
		this._serverErrors = [], this._serverErrorValue = null, this._state = {
			name: this.name,
			value: this.readValue(),
			isValid: !0,
			isDirty: !1,
			isTouched: !1,
			errors: []
		}, this.updateDOM(!0, []);
	}
	destroy() {
		this._destroyed = !0, this.plugin?.destroy(), this.plugin = null, this.abortController.abort(), this.debounceTimer && clearTimeout(this.debounceTimer), this.restoreNativeValidation(), this.onChange = null, this.fieldListeners.clear();
	}
	disableNativeValidation() {
		for (let e of S) this.input.hasAttribute(e) && (this.savedNativeAttrs.set(e, this.input.getAttribute(e) ?? ""), this.input.removeAttribute(e));
	}
	restoreNativeValidation() {
		for (let [e, t] of this.savedNativeAttrs) t === "" ? this.input.setAttribute(e, "") : this.input.setAttribute(e, t);
		this.savedNativeAttrs.clear();
	}
	bind() {
		let e = this.abortController.signal;
		this.input.addEventListener("blur", () => {
			this._state.isTouched = !0, this.validate(), this.notifyChange();
		}, { signal: e }), this.input.addEventListener("input", () => {
			this._state.isDirty = !0, this.debounceTimer && clearTimeout(this.debounceTimer), this.debounceTimer = setTimeout(() => {
				this._state.isTouched && this.validate(), this.notifyChange();
			}, 300);
		}, { signal: e }), this.input.addEventListener("change", () => {
			this._state.isDirty = !0, this._state.isTouched = !0, this.validate(), this.notifyChange();
		}, { signal: e });
	}
	notifyChange() {
		this._state.value = this.readValue(), this.emitFieldEvent("change"), this.emitFieldEvent(this._state.isValid ? "valid" : "invalid"), this.onChange?.(this.state);
	}
	readValue() {
		if (this.input instanceof HTMLSelectElement && this.input.multiple) return Array.from(this.input.selectedOptions).map((e) => e.value).join(",");
		if (this.input instanceof HTMLInputElement) {
			if (this.input.type === "checkbox" || this.input.type === "radio") return this.readGroupValue();
			if (this.input.type === "file") return this.input.files?.length ? this.input.value : "";
		}
		return this.input.value;
	}
	readGroupValue() {
		let e = this.wrapper.querySelectorAll("input[type=\"radio\"], input[type=\"checkbox\"]");
		if (e.length <= 1) return this.input.checked ? this.input.value : "";
		let t = [];
		return e.forEach((e) => {
			e.checked && t.push(e.value);
		}), t.join(",");
	}
	findErrorsElement() {
		let e = this.input.id;
		if (e) {
			let t = document.getElementById(`${e}-errors`);
			if (t) return t;
		}
		let n = this.wrapper.querySelector("[role=\"radiogroup\"], [role=\"group\"]");
		if (n?.id) {
			let e = document.getElementById(`${n.id}-errors`);
			if (e) return e;
		}
		return this.wrapper.querySelector(`.${t.errorMsgClass}`);
	}
	updateDOM(e, n) {
		e ? (this.input.classList.remove(t.errorClass), this.wrapper.classList.remove(t.errorClass), this.input.removeAttribute("aria-invalid"), this.removeErrorsFromDescribedBy()) : (this.input.classList.add(t.errorClass), this.wrapper.classList.add(t.errorClass), this.input.setAttribute("aria-invalid", "true"), this.addErrorsToDescribedBy()), this.options.renderErrors ? this.options.renderErrors(n, this) : this.errorsEl && (this.errorsEl.innerHTML = n.map((e) => this.escapeHtml(e)).join("<br/>"));
	}
	addErrorsToDescribedBy() {
		if (!this.errorsEl?.id) return;
		let e = (this.input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
		e.includes(this.errorsEl.id) || (e.push(this.errorsEl.id), this.input.setAttribute("aria-describedby", e.join(" ")));
	}
	removeErrorsFromDescribedBy() {
		if (!this.errorsEl?.id) return;
		let e = (this.input.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((e) => e !== this.errorsEl.id);
		e.length > 0 ? this.input.setAttribute("aria-describedby", e.join(" ")) : this.input.removeAttribute("aria-describedby");
	}
	parseRules() {
		let e = this.wrapper.getAttribute("data-validate");
		if (!e) return [];
		try {
			let t = JSON.parse(e);
			return Array.isArray(t) ? t : [];
		} catch {
			return console.warn(`[FormsModule] Invalid data-validate JSON on field "${this.name}"`), [];
		}
	}
	escapeHtml(e) {
		let t = document.createElement("div");
		return t.textContent = e, t.innerHTML;
	}
}, w = class {
	listeners = /* @__PURE__ */ new Map();
	on(e, t) {
		let n = this.listeners.get(e);
		n || (n = /* @__PURE__ */ new Set(), this.listeners.set(e, n)), n.add(t);
	}
	once(e, t) {
		let n = ((...r) => {
			this.off(e, n), t(...r);
		});
		this.on(e, n);
	}
	off(e, t) {
		this.listeners.get(e)?.delete(t);
	}
	emit(e, t) {
		let n = this.listeners.get(e);
		if (n) for (let r of [...n]) try {
			r(t);
		} catch (t) {
			console.error(`[FormsModule] Error in "${e}" handler:`, t);
		}
	}
	destroy() {
		this.listeners.clear();
	}
}, T = /* @__PURE__ */ new Map();
function E(e, t) {
	T.set(e, t);
}
function D(e) {
	return T.delete(e);
}
function O(e) {
	return T.get(e);
}
function k(e) {
	return T.has(e);
}
//#endregion
//#region src/forms/form-controller.ts
var A = class {
	id;
	formEl;
	fieldSelector;
	fields = /* @__PURE__ */ new Map();
	formPlugins = [];
	eventBus = new w();
	observer;
	abortController = new AbortController();
	submitFn;
	_isSubmitting = !1;
	_allowSubmit = !1;
	constructor(e, t, r) {
		this.formEl = e, this.id = e.id, this.submitFn = t, this.fieldSelector = r?.fieldSelector ?? n.formField, this.formEl.setAttribute("novalidate", ""), this.discoverFields(), this.observer = this.createObserver(), this.bindSubmit();
	}
	getField(e) {
		return this.fields.get(e)?.state;
	}
	getState() {
		let e = {};
		for (let [t, n] of this.fields) e[t] = n.state;
		return {
			id: this.id,
			isValid: this.computeIsValid(),
			isSubmitting: this._isSubmitting,
			isDirty: this.computeIsDirty(),
			fields: e
		};
	}
	async validate() {
		let e = null;
		for (let t of this.fields.values()) !t.validate().isValid && !e && (e = t);
		let t = this.computeIsValid(), n = {
			formId: this.id,
			state: this.getState()
		};
		return this.eventBus.emit(t ? "form:valid" : "form:invalid", n), e && e.inputElement.focus(), t;
	}
	reset() {
		for (let e of this.fields.values()) e.reset();
		this.eventBus.emit("form:reset", {
			formId: this.id,
			state: this.getState()
		});
	}
	destroy() {
		this.abortController.abort(), this.observer.disconnect();
		for (let e of this.formPlugins) e.destroy();
		this.formPlugins.length = 0;
		for (let e of this.fields.values()) e.destroy();
		this.fields.clear(), this.eventBus.destroy();
	}
	submit() {
		this.formEl.requestSubmit();
	}
	on(e, t) {
		this.eventBus.on(e, t);
	}
	once(e, t) {
		this.eventBus.once(e, t);
	}
	off(e, t) {
		this.eventBus.off(e, t);
	}
	async attachFormPlugin(e) {
		this.formPlugins.push(e), await e.init(this.formEl, this);
	}
	getFieldValue(e) {
		return this.fields.get(e)?.state.value;
	}
	getFieldNames() {
		return [...this.fields.keys()];
	}
	setFieldEnabled(e, t) {
		let n = this.fields.get(e);
		n && n.setEnabled(t);
	}
	discoverFields() {
		this.formEl.querySelectorAll(this.fieldSelector).forEach((e) => this.initField(e));
	}
	initField(e) {
		let t = e.getAttribute("data-form-field");
		if (!(!t || this.fields.has(t))) try {
			let n = new C(e);
			n.setChangeCallback((e) => this.handleFieldChange(e)), this.fields.set(t, n), this.loadPluginIfNeeded(n);
			let r = {
				formId: this.id,
				fieldName: t,
				state: n.state
			};
			this.eventBus.emit("field:added", r);
		} catch (e) {
			console.warn(`[FormsModule] Could not init field "${t}":`, e);
		}
	}
	loadPluginIfNeeded(e) {
		let t = e.fieldType;
		if (!t) return;
		let n = O(t);
		n && n().then(({ default: t }) => {
			let n = new t();
			return e.attachPlugin(n);
		}).catch((e) => {
			console.warn(`[FormsModule] Failed to load plugin "${t}":`, e);
		});
	}
	destroyField(e) {
		let t = e.getAttribute("data-form-field");
		if (!t) return;
		let n = this.fields.get(t);
		if (!n) return;
		let r = {
			formId: this.id,
			fieldName: t,
			state: n.state
		};
		n.destroy(), this.fields.delete(t), this.eventBus.emit("field:removed", r);
	}
	handleFieldChange(e) {
		let t = e.isValid ? "field:valid" : "field:invalid", n = {
			formId: this.id,
			fieldName: e.name,
			state: e
		};
		this.eventBus.emit("field:change", n), this.eventBus.emit(t, n);
	}
	createObserver() {
		let e = this.fieldSelector, t = new MutationObserver((t) => {
			for (let n of t) {
				let t = Array.from(n.addedNodes);
				for (let n of t) n instanceof HTMLElement && (n.matches(e) ? [n] : Array.from(n.querySelectorAll(e))).forEach((e) => this.initField(e));
				let r = Array.from(n.removedNodes);
				for (let t of r) t instanceof HTMLElement && (t.matches(e) ? [t] : Array.from(t.querySelectorAll(e))).forEach((e) => this.destroyField(e));
			}
		});
		return t.observe(this.formEl, {
			childList: !0,
			subtree: !0
		}), t;
	}
	bindSubmit() {
		let e = this.abortController.signal;
		this.formEl.addEventListener("submit", async (e) => {
			if (this._allowSubmit) {
				this._allowSubmit = !1;
				return;
			}
			e.preventDefault(), this._isSubmitting = !0, this.eventBus.emit("form:submit", {
				formId: this.id,
				state: this.getState()
			});
			try {
				if (await this.validate()) {
					let t = e.submitter, n = new FormData(this.formEl, t);
					await this.submitFn({
						formEl: this.formEl,
						formData: n,
						submitter: t,
						signal: this.abortController.signal,
						fallbackToNative: () => {
							this._allowSubmit = !0, this.formEl.requestSubmit();
						},
						applyValidationErrors: (e) => {
							this.applyServerErrors(e);
						},
						nextStep: (e) => {
							this.updateStateHiddenField(e), this.eventBus.emit("form:valid", {
								formId: this.id,
								state: this.getState()
							});
						},
						redirect: (e) => {
							window.location.href = e;
						},
						finish: (e) => {
							this.destroy(), e && (this.formEl.outerHTML = e);
						}
					});
				}
			} finally {
				this._isSubmitting = !1;
			}
		}, { signal: e });
	}
	applyServerErrors(e) {
		for (let [t, n] of Object.entries(e)) {
			let e = this.fields.get(t);
			e && e.setServerErrors(n);
		}
		let t = [...this.fields.values()].find((e) => !e.state.isValid);
		t && t.inputElement.focus();
		let n = {
			formId: this.id,
			state: this.getState()
		};
		this.eventBus.emit("form:invalid", n);
	}
	updateStateHiddenField(e) {
		if (!e) return;
		let t = this.formEl.querySelector("input[name$=\"[__state]\"]");
		t && (t.value = e);
	}
	computeIsValid() {
		for (let e of this.fields.values()) if (!e.state.isValid) return !1;
		return !0;
	}
	computeIsDirty() {
		for (let e of this.fields.values()) if (e.state.isDirty) return !0;
		return !1;
	}
}, j = class {
	forms = /* @__PURE__ */ new Map();
	formPluginFactories = [];
	eventBus = new w();
	_initialized = !1;
	init(e, t = document, n = "form[id]", r) {
		this._initialized = !0, t.querySelectorAll(n).forEach((t) => this.register(t, e, r));
	}
	register(e, t, n) {
		if (this.forms.has(e.id)) return this.forms.get(e.id);
		let r = new A(e, t, n);
		return this.forms.set(e.id, r), this.loadFormPlugins(r), this.eventBus.emit("form:registered", { formId: e.id }), r;
	}
	loadFormPlugins(e) {
		for (let t of this.formPluginFactories) t().then(({ default: t }) => {
			let n = new t();
			return e.attachFormPlugin(n);
		}).catch((e) => {
			console.warn("[FormsModule] Failed to load form plugin:", e);
		});
	}
	unregister(e) {
		let t = this.forms.get(e);
		t && (t.destroy(), this.forms.delete(e), this.eventBus.emit("form:unregistered", { formId: e }));
	}
	get(e) {
		return this.forms.get(e);
	}
	getAll() {
		return new Map(this.forms);
	}
	on(e, t) {
		this.eventBus.on(e, t);
	}
	off(e, t) {
		this.eventBus.off(e, t);
	}
	registerValidator(e) {
		b(e);
	}
	registerPlugin(e, t) {
		E(e, t);
	}
	unregisterPlugin(e) {
		return D(e);
	}
	hasPlugin(e) {
		return k(e);
	}
	registerFormPlugin(e) {
		this._initialized && console.warn("[FormsModule] registerFormPlugin called after init — new plugin will only apply to forms registered after this point"), this.formPluginFactories.push(e);
	}
}, M = new j();
typeof window < "u" && (window.__FormsModule = M);
//#endregion
//#region src/forms/plugins/client-variants/expression-parser.ts
var N = {
	String: 0,
	Number: 1,
	Boolean: 2,
	FormValue: 3,
	Operator: 4,
	LParen: 5,
	RParen: 6,
	Not: 7,
	And: 8,
	Or: 9,
	In: 10,
	LBracket: 11,
	RBracket: 12,
	Comma: 13,
	EOF: 14
};
function P(e) {
	return !e || !/[a-zA-Z0-9_]/.test(e);
}
function F(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = e[n];
		if (/\s/.test(r)) {
			n++;
			continue;
		}
		if (r === "(") {
			t.push({
				type: N.LParen,
				value: "("
			}), n++;
			continue;
		}
		if (r === ")") {
			t.push({
				type: N.RParen,
				value: ")"
			}), n++;
			continue;
		}
		if (r === "[") {
			t.push({
				type: N.LBracket,
				value: "["
			}), n++;
			continue;
		}
		if (r === "]") {
			t.push({
				type: N.RBracket,
				value: "]"
			}), n++;
			continue;
		}
		if (r === ",") {
			t.push({
				type: N.Comma,
				value: ","
			}), n++;
			continue;
		}
		if (r === "!" && e[n + 1] === "=" && e[n + 2] === "=") {
			t.push({
				type: N.Operator,
				value: "!=="
			}), n += 3;
			continue;
		}
		if (r === "!" && e[n + 1] === "=") {
			t.push({
				type: N.Operator,
				value: "!="
			}), n += 2;
			continue;
		}
		if (r === "!") {
			t.push({
				type: N.Not,
				value: "!"
			}), n++;
			continue;
		}
		if (r === "=" && e[n + 1] === "=" && e[n + 2] === "=") {
			t.push({
				type: N.Operator,
				value: "==="
			}), n += 3;
			continue;
		}
		if (r === "=" && e[n + 1] === "=") {
			t.push({
				type: N.Operator,
				value: "=="
			}), n += 2;
			continue;
		}
		if (r === ">" && e[n + 1] === "=") {
			t.push({
				type: N.Operator,
				value: ">="
			}), n += 2;
			continue;
		}
		if (r === "<" && e[n + 1] === "=") {
			t.push({
				type: N.Operator,
				value: "<="
			}), n += 2;
			continue;
		}
		if (r === ">") {
			t.push({
				type: N.Operator,
				value: ">"
			}), n++;
			continue;
		}
		if (r === "<") {
			t.push({
				type: N.Operator,
				value: "<"
			}), n++;
			continue;
		}
		if (r === "&" && e[n + 1] === "&") {
			t.push({
				type: N.And,
				value: "&&"
			}), n += 2;
			continue;
		}
		if (r === "|" && e[n + 1] === "|") {
			t.push({
				type: N.Or,
				value: "||"
			}), n += 2;
			continue;
		}
		if (r === "\"" || r === "'") {
			let i = r;
			n++;
			let a = "";
			for (; n < e.length && e[n] !== i;) e[n] === "\\" ? (n++, a += e[n] ?? "") : a += e[n], n++;
			n++, t.push({
				type: N.String,
				value: a
			});
			continue;
		}
		if (/[0-9]/.test(r) || r === "-" && /[0-9]/.test(e[n + 1] ?? "")) {
			let i = "";
			for (r === "-" && (i = "-", n++); n < e.length && /[0-9.]/.test(e[n]);) i += e[n], n++;
			t.push({
				type: N.Number,
				value: i
			});
			continue;
		}
		if (e.startsWith("formValue", n) && (e[n + 9] === "(" || /\s/.test(e[n + 9] ?? ""))) {
			for (n += 9; n < e.length && e[n] !== "(";) n++;
			for (n++; n < e.length && /\s/.test(e[n]);) n++;
			let r = e[n];
			if (r !== "\"" && r !== "'") throw Error(`Expected quoted string in formValue() at position ${n}`);
			n++;
			let i = "";
			for (; n < e.length && e[n] !== r;) e[n] === "\\" ? (n++, i += e[n] ?? "") : i += e[n], n++;
			for (n++; n < e.length && e[n] !== ")";) n++;
			n++, t.push({
				type: N.FormValue,
				value: i
			});
			continue;
		}
		if (e.startsWith("and", n) && P(e[n + 3])) {
			t.push({
				type: N.And,
				value: "and"
			}), n += 3;
			continue;
		}
		if (e.startsWith("or", n) && P(e[n + 2])) {
			t.push({
				type: N.Or,
				value: "or"
			}), n += 2;
			continue;
		}
		if (e.startsWith("not", n) && P(e[n + 3])) {
			t.push({
				type: N.Not,
				value: "not"
			}), n += 3;
			continue;
		}
		if (e.startsWith("in", n) && P(e[n + 2])) {
			t.push({
				type: N.In,
				value: "in"
			}), n += 2;
			continue;
		}
		if (e.startsWith("true", n) && P(e[n + 4])) {
			t.push({
				type: N.Boolean,
				value: "true"
			}), n += 4;
			continue;
		}
		if (e.startsWith("false", n) && P(e[n + 5])) {
			t.push({
				type: N.Boolean,
				value: "false"
			}), n += 5;
			continue;
		}
		throw Error(`Unexpected character "${r}" at position ${n} in expression`);
	}
	return t.push({
		type: N.EOF,
		value: ""
	}), t;
}
var I = class {
	tokens;
	pos = 0;
	resolver;
	constructor(e, t) {
		this.tokens = e, this.resolver = t;
	}
	parse() {
		let e = this.parseOr();
		if (this.current().type !== N.EOF) throw Error(`Unexpected token "${this.current().value}" after expression`);
		return e;
	}
	current() {
		return this.tokens[this.pos];
	}
	advance() {
		return this.tokens[this.pos++];
	}
	parseOr() {
		let e = this.parseAnd();
		for (; this.current().type === N.Or;) {
			this.advance();
			let t = this.parseAnd();
			e = !!e || !!t;
		}
		return e;
	}
	parseAnd() {
		let e = this.parseIn();
		for (; this.current().type === N.And;) {
			this.advance();
			let t = this.parseIn();
			e = !!e && !!t;
		}
		return e;
	}
	parseIn() {
		let e = this.parseComparison();
		if (this.current().type === N.In) {
			this.advance();
			let t = this.parseArray();
			if (!Array.isArray(t)) throw Error("Right side of \"in\" must be an array");
			return t.includes(e);
		}
		return e;
	}
	parseComparison() {
		let e = this.parseUnary();
		if (this.current().type === N.Operator) {
			let t = this.advance().value, n = this.parseUnary();
			return this.compare(e, t, n);
		}
		return e;
	}
	parseUnary() {
		return this.current().type === N.Not ? (this.advance(), !this.parseUnary()) : this.parsePrimary();
	}
	parsePrimary() {
		let e = this.current();
		switch (e.type) {
			case N.String: return this.advance(), e.value;
			case N.Number: return this.advance(), parseFloat(e.value);
			case N.Boolean: return this.advance(), e.value === "true";
			case N.FormValue: return this.advance(), this.resolver(e.value);
			case N.LParen: {
				this.advance();
				let e = this.parseOr();
				if (this.current().type !== N.RParen) throw Error("Expected closing parenthesis");
				return this.advance(), e;
			}
			case N.LBracket: return this.parseArray();
			default: throw Error(`Unexpected token "${e.value}" (type ${e.type})`);
		}
	}
	parseArray() {
		if (this.current().type !== N.LBracket) throw Error("Expected \"[\" for array literal");
		this.advance();
		let e = [];
		if (this.current().type !== N.RBracket) for (e.push(this.parsePrimary()); this.current().type === N.Comma;) this.advance(), e.push(this.parsePrimary());
		if (this.current().type !== N.RBracket) throw Error("Expected \"]\" to close array literal");
		return this.advance(), e;
	}
	compare(e, t, n) {
		switch (t) {
			case "===":
			case "==": return e === n;
			case "!==":
			case "!=": return e !== n;
			case ">": return Number(e) > Number(n);
			case "<": return Number(e) < Number(n);
			case ">=": return Number(e) >= Number(n);
			case "<=": return Number(e) <= Number(n);
			default: return !1;
		}
	}
};
function L(e, t) {
	return !!new I(F(e), t).parse();
}
//#endregion
//#region src/forms/plugins/client-variants/client-variants-plugin.ts
var R = /* @__PURE__ */ e({ default: () => B }), z = "__clientVariantsDisabled", B = class {
	host;
	formEl;
	configs = [];
	disabledInput;
	changeHandler;
	addedHandler;
	async init(e, t) {
		this.host = t, this.formEl = e, this.configs = this.parseConfigs(), this.disabledInput = this.createDisabledFieldsInput(), this.changeHandler = () => this.evaluate(), this.addedHandler = () => {
			this.configs = this.parseConfigs(), this.evaluate();
		}, this.host.on("field:change", this.changeHandler), this.host.on("field:added", this.addedHandler), this.configs.length > 0 && this.evaluate();
	}
	destroy() {
		this.changeHandler && this.host.off("field:change", this.changeHandler), this.addedHandler && this.host.off("field:added", this.addedHandler), this.disabledInput?.remove();
	}
	parseConfigs() {
		let e = [], t = this.formEl.querySelectorAll("[data-client-variants]");
		for (let n of Array.from(t)) {
			let t = n.getAttribute("data-form-field"), r = n.getAttribute("data-client-variants");
			if (!(!t || !r)) try {
				let n = JSON.parse(r);
				Array.isArray(n) && n.length > 0 && e.push({
					fieldName: t,
					variants: n
				});
			} catch {
				console.warn(`[FormsModule] Invalid data-client-variants JSON on field "${t}"`);
			}
		}
		return e;
	}
	createDisabledFieldsInput() {
		let e = this.formEl.querySelector(`input[name="${z}"]`);
		return e || (e = document.createElement("input"), e.type = "hidden", e.name = z, this.formEl.appendChild(e)), e;
	}
	evaluate() {
		let e = [];
		for (let t of this.configs) {
			let n = this.evaluateVariants(t.variants);
			this.host.setFieldEnabled(t.fieldName, n), n || e.push(t.fieldName);
		}
		this.disabledInput.value = e.join(",");
	}
	evaluateVariants(e) {
		for (let t of e) try {
			if (L(t.condition, (e) => this.host.getFieldValue(e) ?? "") && t.enabled === !0) return !0;
		} catch (e) {
			console.warn("[FormsModule] Error evaluating variant condition:", e);
		}
		return !1;
	}
};
//#endregion
//#region src/typo3/submit.ts
function V(e) {
	return async (t) => {
		let { formEl: n, formData: r, signal: i, fallbackToNative: a, applyValidationErrors: o, nextStep: s, redirect: c, finish: l } = t;
		if (e?.onBeforeSubmit?.(t) === !1) return;
		let u;
		try {
			u = await fetch(n.action, {
				method: "POST",
				headers: { "X-Form-Ajax": "1" },
				body: r,
				signal: i
			});
		} catch (t) {
			t.name !== "AbortError" && (console.warn("[Typo3Forms] AJAX submit failed:", t), e?.onSubmitError?.(t, n), a());
			return;
		}
		if (!u.ok) {
			let t = /* @__PURE__ */ Error(`Server responded with ${u.status}`);
			console.warn(`[Typo3Forms] ${t.message}, falling back to normal submit`), e?.onSubmitError?.(t, n), a();
			return;
		}
		let d;
		try {
			d = await u.json();
		} catch {
			console.warn("[Typo3Forms] Invalid JSON response, falling back to normal submit"), e?.onSubmitError?.(/* @__PURE__ */ Error("Invalid JSON response"), n), a();
			return;
		}
		if (e?.onAfterSubmit?.(d, n), !d.valid) {
			o(d.errors), e?.onValidationError?.(d.errors, n);
			return;
		}
		if (d.finished) {
			if (e?.onFormFinished?.(d, n), d.redirect) {
				c(d.redirect);
				return;
			}
			l(d.message ?? void 0);
			return;
		}
		d.html && (n.innerHTML = d.html), s(d.state), e?.onStepChange?.(d.page, n);
	};
}
//#endregion
//#region src/forms/init-field.ts
function H(e, t, n) {
	let r = new C(G(e), n);
	return U(r, t ?? r.fieldType), r;
}
function U(e, t) {
	if (t) {
		if (typeof t == "string") {
			let n = O(t);
			if (!n) return;
			n().then(({ default: t }) => e.attachPlugin(new t())).catch((e) => {
				console.warn(`[FormsModule] Failed to load plugin "${t}":`, e);
			});
			return;
		}
		if (typeof t == "function") {
			e.attachPlugin(new t());
			return;
		}
		e.attachPlugin(t);
	}
}
var W = "input, select, textarea";
function G(e) {
	if (e.hasAttribute("data-form-field")) return e;
	if (e.matches(W)) {
		let t = e.closest("[data-form-field]");
		if (t) return t;
	}
	throw Error("[FormsModule] initField() expects a [data-form-field] wrapper or an input inside one.");
}
//#endregion
//#region src/typo3/index.ts
var K = !1;
function q(e) {
	if (K) return console.warn("[Typo3Forms] initTypo3Forms() called more than once — ignoring duplicate call"), {
		registry: M,
		destroy() {}
	};
	K = !0, e?.disableDefaultValidators || y();
	for (let t of e?.additionalValidators ?? []) M.registerValidator(t);
	E("combobox", () => import("./combobox-DljG2TLr.js")), E("datepicker", () => import("./datepicker-BGS6ff8f.js")), M.registerFormPlugin(() => Promise.resolve().then(() => R));
	for (let [t, n] of Object.entries(e?.additionalFieldPlugins ?? {})) E(t, n);
	for (let t of e?.additionalFormPlugins ?? []) M.registerFormPlugin(t);
	let t = e?.onSubmit ?? V(e?.hooks), n = null;
	if (e?.hooks?.onFormRegistered) {
		let t = e.hooks.onFormRegistered;
		n = ({ formId: e }) => {
			let n = M.get(e);
			n && t(n);
		}, M.on("form:registered", n);
	}
	let r = e?.formSelector, i = e?.fieldSelector ? { fieldSelector: e.fieldSelector } : void 0, a = () => M.init(t, document, r, i), o = null;
	return document.readyState === "loading" ? (o = a, document.addEventListener("DOMContentLoaded", o)) : a(), {
		registry: M,
		destroy() {
			for (let [e] of M.getAll()) M.unregister(e);
			n && M.off("form:registered", n), o && document.removeEventListener("DOMContentLoaded", o), K = !1;
		}
	};
}
//#endregion
export { B as ClientVariantsPlugin, j as FormRegistry, V as createTypo3Submit, M as formRegistry, k as hasPlugin, H as initField, q as initTypo3Forms, y as registerDefaultValidators, E as registerPlugin, b as registerValidator, D as unregisterPlugin };
