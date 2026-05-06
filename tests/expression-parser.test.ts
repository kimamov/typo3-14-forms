import { describe, it, expect } from 'vitest';
import { evaluateExpression } from '../src/forms/plugins/client-variants/expression-parser';

const resolver = (values: Record<string, string>) => (name: string) => values[name] ?? '';

describe('Expression Parser', () => {
  describe('equality operators', () => {
    it('evaluates == with matching strings', () => {
      expect(evaluateExpression('formValue("country") == "de"', resolver({ country: 'de' }))).toBe(true);
    });

    it('evaluates == with non-matching strings', () => {
      expect(evaluateExpression('formValue("country") == "de"', resolver({ country: 'fr' }))).toBe(false);
    });

    it('evaluates != correctly', () => {
      expect(evaluateExpression('formValue("country") != "de"', resolver({ country: 'fr' }))).toBe(true);
      expect(evaluateExpression('formValue("country") != "de"', resolver({ country: 'de' }))).toBe(false);
    });

    it('evaluates === (strict) as alias for ==', () => {
      expect(evaluateExpression('formValue("x") === "yes"', resolver({ x: 'yes' }))).toBe(true);
    });

    it('evaluates !== (strict) as alias for !=', () => {
      expect(evaluateExpression('formValue("x") !== "no"', resolver({ x: 'yes' }))).toBe(true);
    });
  });

  describe('comparison operators', () => {
    it('evaluates > with numeric values', () => {
      expect(evaluateExpression('formValue("age") > 18', resolver({ age: '25' }))).toBe(true);
      expect(evaluateExpression('formValue("age") > 18', resolver({ age: '10' }))).toBe(false);
    });

    it('evaluates < correctly', () => {
      expect(evaluateExpression('formValue("count") < 5', resolver({ count: '3' }))).toBe(true);
    });

    it('evaluates >= correctly', () => {
      expect(evaluateExpression('formValue("age") >= 18', resolver({ age: '18' }))).toBe(true);
      expect(evaluateExpression('formValue("age") >= 18', resolver({ age: '17' }))).toBe(false);
    });

    it('evaluates <= correctly', () => {
      expect(evaluateExpression('formValue("score") <= 100', resolver({ score: '100' }))).toBe(true);
      expect(evaluateExpression('formValue("score") <= 100', resolver({ score: '101' }))).toBe(false);
    });
  });

  describe('logical operators (JS style)', () => {
    it('evaluates && with both true', () => {
      expect(evaluateExpression(
        'formValue("a") == "1" && formValue("b") == "2"',
        resolver({ a: '1', b: '2' }),
      )).toBe(true);
    });

    it('evaluates && with one false', () => {
      expect(evaluateExpression(
        'formValue("a") == "1" && formValue("b") == "2"',
        resolver({ a: '1', b: '3' }),
      )).toBe(false);
    });

    it('evaluates || with one true', () => {
      expect(evaluateExpression(
        'formValue("a") == "1" || formValue("b") == "2"',
        resolver({ a: '1', b: '3' }),
      )).toBe(true);
    });

    it('evaluates || with both false', () => {
      expect(evaluateExpression(
        'formValue("a") == "x" || formValue("b") == "y"',
        resolver({ a: '1', b: '2' }),
      )).toBe(false);
    });

    it('evaluates ! (not) operator', () => {
      expect(evaluateExpression('!false', resolver({}))).toBe(true);
      expect(evaluateExpression('!true', resolver({}))).toBe(false);
    });

    it('negates a comparison', () => {
      expect(evaluateExpression(
        '!(formValue("x") == "no")',
        resolver({ x: 'yes' }),
      )).toBe(true);
    });
  });

  describe('logical operators (Symfony style)', () => {
    it('evaluates "and" keyword', () => {
      expect(evaluateExpression(
        'formValue("a") == "1" and formValue("b") == "2"',
        resolver({ a: '1', b: '2' }),
      )).toBe(true);
    });

    it('evaluates "or" keyword', () => {
      expect(evaluateExpression(
        'formValue("a") == "x" or formValue("b") == "2"',
        resolver({ a: '1', b: '2' }),
      )).toBe(true);
    });

    it('evaluates "not" keyword', () => {
      expect(evaluateExpression('not false', resolver({}))).toBe(true);
    });
  });

  describe('in operator', () => {
    it('checks membership in array of strings', () => {
      expect(evaluateExpression(
        'formValue("country") in ["de", "at", "ch"]',
        resolver({ country: 'at' }),
      )).toBe(true);
    });

    it('returns false when not in array', () => {
      expect(evaluateExpression(
        'formValue("country") in ["de", "at", "ch"]',
        resolver({ country: 'fr' }),
      )).toBe(false);
    });

    it('works with numeric array', () => {
      expect(evaluateExpression(
        'formValue("rating") in [1, 2, 3]',
        resolver({ rating: '2' }),
      )).toBe(false); // "2" !== 2 (strict comparison)
    });
  });

  describe('grouping with parentheses', () => {
    it('respects parentheses for operator precedence', () => {
      expect(evaluateExpression(
        '(formValue("a") == "1" || formValue("b") == "2") && formValue("c") == "3"',
        resolver({ a: '1', b: 'x', c: '3' }),
      )).toBe(true);
    });

    it('nested parentheses', () => {
      expect(evaluateExpression(
        '((formValue("x") == "a") && (formValue("y") == "b"))',
        resolver({ x: 'a', y: 'b' }),
      )).toBe(true);
    });
  });

  describe('literals', () => {
    it('handles string literals with single quotes', () => {
      expect(evaluateExpression("formValue('name') == 'hello'", resolver({ name: 'hello' }))).toBe(true);
    });

    it('handles numeric literals', () => {
      expect(evaluateExpression('42 == 42', resolver({}))).toBe(true);
    });

    it('handles negative numbers', () => {
      expect(evaluateExpression('-5 < 0', resolver({}))).toBe(true);
    });

    it('handles boolean literals', () => {
      expect(evaluateExpression('true', resolver({}))).toBe(true);
      expect(evaluateExpression('false', resolver({}))).toBe(false);
    });

    it('handles decimal numbers', () => {
      expect(evaluateExpression('1.5 > 1', resolver({}))).toBe(true);
    });
  });

  describe('complex real-world expressions', () => {
    it('multi-condition form visibility: country + type', () => {
      const expr = 'formValue("country") == "de" && formValue("type") in ["business", "enterprise"]';
      expect(evaluateExpression(expr, resolver({ country: 'de', type: 'business' }))).toBe(true);
      expect(evaluateExpression(expr, resolver({ country: 'de', type: 'personal' }))).toBe(false);
      expect(evaluateExpression(expr, resolver({ country: 'fr', type: 'business' }))).toBe(false);
    });

    it('conditional with empty field check', () => {
      const expr = 'formValue("email") != "" && formValue("newsletter") == "yes"';
      expect(evaluateExpression(expr, resolver({ email: 'a@b.com', newsletter: 'yes' }))).toBe(true);
      expect(evaluateExpression(expr, resolver({ email: '', newsletter: 'yes' }))).toBe(false);
    });
  });

  describe('error handling', () => {
    it('throws on unexpected character', () => {
      expect(() => evaluateExpression('formValue("x") @ "y"', resolver({}))).toThrow();
    });

    it('throws on unclosed parenthesis', () => {
      expect(() => evaluateExpression('(formValue("x") == "y"', resolver({}))).toThrow();
    });

    it('throws when "in" right side is not an array', () => {
      expect(() => evaluateExpression('formValue("x") in "abc"', resolver({}))).toThrow();
    });
  });
});
