//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
}, c = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, l = (n, r, a) => (a = n == null ? {} : e(i(n)), c(r || !n || !n.__esModule ? t(a, "default", {
	value: n,
	enumerable: !0
}) : a, n)), u = {
	Y: "yyyy",
	y: "yy",
	m: "MM",
	n: "M",
	d: "dd",
	j: "d"
};
function d(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		r === "\\" && n + 1 < e.length ? t += e[++n] : t += u[r] ?? r;
	}
	return t;
}
var f = class {
	picker = null;
	async init(e, t) {
		let n = t.inputElement, r = n.closest("[data-field-type]")?.querySelector("input[type=\"hidden\"][name$=\"[dateFormat]\"]")?.value ?? "Y-m-d", i = d(r), { default: a } = await import("air-datepicker");
		await Promise.resolve({                   });
		let o = await import("./en-CXOXiZNu.js").then((e) => /* @__PURE__ */ l(e.default, 1)), s = o.default?.days ? o.default : o.default?.default ?? o, c = n.value ? this.parseByFormat(n.value, r) : void 0;
		this.picker = new a(n, {
			dateFormat: i,
			autoClose: !0,
			isMobile: window.matchMedia("(pointer: coarse)").matches,
			selectedDates: c ? [c] : void 0,
			buttons: ["today", "clear"],
			locale: s,
			onSelect: ({ date: e }) => {
				(Array.isArray(e) ? e[0] : e) || (n.value = ""), t.setValue(n.value);
			}
		});
	}
	destroy() {
		this.picker?.destroy(), this.picker = null;
	}
	parseByFormat(e, t) {
		if (/^\d{4}-\d{2}-\d{2}$/.test(e)) {
			let t = /* @__PURE__ */ new Date(e + "T00:00:00");
			return Number.isNaN(t.getTime()) ? void 0 : t;
		}
		let n = t.match(/[YymndjFM]/g) ?? [], r = e.split(/[\s./-]+/), i = 2e3, a = 0, o = 1;
		n.forEach((e, t) => {
			let n = parseInt(r[t], 10);
			if (!Number.isNaN(n)) switch (e) {
				case "Y":
					i = n;
					break;
				case "y":
					i = n < 50 ? 2e3 + n : 1900 + n;
					break;
				case "m":
				case "n":
					a = n - 1;
					break;
				case "d":
				case "j":
					o = n;
					break;
			}
		});
		let s = new Date(i, a, o);
		return Number.isNaN(s.getTime()) ? void 0 : s;
	}
};
//#endregion
export { f as default, s as n, o as t };
