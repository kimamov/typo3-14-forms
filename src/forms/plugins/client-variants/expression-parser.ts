/**
 * A safe expression evaluator for client variant conditions.
 * Supports a subset of Symfony ExpressionLanguage syntax so that
 * conditions can be evaluated identically on both frontend (this parser)
 * and backend (PHP Symfony ExpressionLanguage with formValue() provider).
 *
 * Supported syntax:
 *   formValue("fieldName")       - resolves to the current string value of a field
 *   "string" or 'string'        - string literals
 *   123, 1.5                    - numeric literals
 *   true, false                 - boolean literals
 *   ==, !=                      - equality / inequality
 *   ===, !==                    - strict equality (JS-compatible alias for ==, !=)
 *   >, <, >=, <=               - comparison (numeric coercion)
 *   &&, ||, !                   - logical operators (JS style)
 *   and, or, not                - logical operators (Symfony style)
 *   in                          - membership test: value in ["a", "b"]
 *   ( ... )                     - grouping
 *   [ ... ]                     - array literal (for use with `in`)
 */

type ValueResolver = (fieldName: string) => string;

const TokenType = {
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
  EOF: 14,
} as const;

type TokenTypeValue = (typeof TokenType)[keyof typeof TokenType];

interface Token {
  type: TokenTypeValue;
  value: string;
}

function isWordBoundary(ch: string | undefined): boolean {
  return !ch || !/[a-zA-Z0-9_]/.test(ch);
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: TokenType.LParen, value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: TokenType.RParen, value: ')' });
      i++;
      continue;
    }

    if (ch === '[') {
      tokens.push({ type: TokenType.LBracket, value: '[' });
      i++;
      continue;
    }

    if (ch === ']') {
      tokens.push({ type: TokenType.RBracket, value: ']' });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: TokenType.Comma, value: ',' });
      i++;
      continue;
    }

    if (ch === '!' && expr[i + 1] === '=' && expr[i + 2] === '=') {
      tokens.push({ type: TokenType.Operator, value: '!==' });
      i += 3;
      continue;
    }

    if (ch === '!' && expr[i + 1] === '=') {
      tokens.push({ type: TokenType.Operator, value: '!=' });
      i += 2;
      continue;
    }

    if (ch === '!') {
      tokens.push({ type: TokenType.Not, value: '!' });
      i++;
      continue;
    }

    if (ch === '=' && expr[i + 1] === '=' && expr[i + 2] === '=') {
      tokens.push({ type: TokenType.Operator, value: '===' });
      i += 3;
      continue;
    }

    if (ch === '=' && expr[i + 1] === '=') {
      tokens.push({ type: TokenType.Operator, value: '==' });
      i += 2;
      continue;
    }

    if (ch === '>' && expr[i + 1] === '=') {
      tokens.push({ type: TokenType.Operator, value: '>=' });
      i += 2;
      continue;
    }

    if (ch === '<' && expr[i + 1] === '=') {
      tokens.push({ type: TokenType.Operator, value: '<=' });
      i += 2;
      continue;
    }

    if (ch === '>') {
      tokens.push({ type: TokenType.Operator, value: '>' });
      i++;
      continue;
    }

    if (ch === '<') {
      tokens.push({ type: TokenType.Operator, value: '<' });
      i++;
      continue;
    }

    if (ch === '&' && expr[i + 1] === '&') {
      tokens.push({ type: TokenType.And, value: '&&' });
      i += 2;
      continue;
    }

    if (ch === '|' && expr[i + 1] === '|') {
      tokens.push({ type: TokenType.Or, value: '||' });
      i += 2;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let str = '';
      while (i < expr.length && expr[i] !== quote) {
        if (expr[i] === '\\') {
          i++;
          str += expr[i] ?? '';
        } else {
          str += expr[i];
        }
        i++;
      }
      i++;
      tokens.push({ type: TokenType.String, value: str });
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(expr[i + 1] ?? ''))) {
      let num = '';
      if (ch === '-') { num = '-'; i++; }
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: TokenType.Number, value: num });
      continue;
    }

    if (expr.startsWith('formValue', i) && (expr[i + 9] === '(' || /\s/.test(expr[i + 9] ?? ''))) {
      i += 9;
      while (i < expr.length && expr[i] !== '(') i++;
      i++;
      while (i < expr.length && /\s/.test(expr[i])) i++;

      const quote = expr[i];
      if (quote !== '"' && quote !== "'") {
        throw new Error(`Expected quoted string in formValue() at position ${i}`);
      }
      i++;
      let fieldName = '';
      while (i < expr.length && expr[i] !== quote) {
        if (expr[i] === '\\') { i++; fieldName += expr[i] ?? ''; }
        else { fieldName += expr[i]; }
        i++;
      }
      i++;
      while (i < expr.length && expr[i] !== ')') i++;
      i++;
      tokens.push({ type: TokenType.FormValue, value: fieldName });
      continue;
    }

    // Symfony-style keyword operators
    if (expr.startsWith('and', i) && isWordBoundary(expr[i + 3])) {
      tokens.push({ type: TokenType.And, value: 'and' });
      i += 3;
      continue;
    }

    if (expr.startsWith('or', i) && isWordBoundary(expr[i + 2])) {
      tokens.push({ type: TokenType.Or, value: 'or' });
      i += 2;
      continue;
    }

    if (expr.startsWith('not', i) && isWordBoundary(expr[i + 3])) {
      tokens.push({ type: TokenType.Not, value: 'not' });
      i += 3;
      continue;
    }

    if (expr.startsWith('in', i) && isWordBoundary(expr[i + 2])) {
      tokens.push({ type: TokenType.In, value: 'in' });
      i += 2;
      continue;
    }

    if (expr.startsWith('true', i) && isWordBoundary(expr[i + 4])) {
      tokens.push({ type: TokenType.Boolean, value: 'true' });
      i += 4;
      continue;
    }

    if (expr.startsWith('false', i) && isWordBoundary(expr[i + 5])) {
      tokens.push({ type: TokenType.Boolean, value: 'false' });
      i += 5;
      continue;
    }

    throw new Error(`Unexpected character "${ch}" at position ${i} in expression`);
  }

  tokens.push({ type: TokenType.EOF, value: '' });
  return tokens;
}

type ExprValue = string | number | boolean | ExprValue[];

class Parser {
  private tokens: Token[];
  private pos = 0;
  private resolver: ValueResolver;

  constructor(tokens: Token[], resolver: ValueResolver) {
    this.tokens = tokens;
    this.resolver = resolver;
  }

  parse(): ExprValue {
    const result = this.parseOr();
    if (this.current().type !== TokenType.EOF) {
      throw new Error(`Unexpected token "${this.current().value}" after expression`);
    }
    return result;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private parseOr(): ExprValue {
    let left = this.parseAnd();
    while (this.current().type === TokenType.Or) {
      this.advance();
      const right = this.parseAnd();
      left = !!(left) || !!(right);
    }
    return left;
  }

  private parseAnd(): ExprValue {
    let left = this.parseIn();
    while (this.current().type === TokenType.And) {
      this.advance();
      const right = this.parseIn();
      left = !!(left) && !!(right);
    }
    return left;
  }

  private parseIn(): ExprValue {
    let left = this.parseComparison();
    if (this.current().type === TokenType.In) {
      this.advance();
      const right = this.parseArray();
      if (!Array.isArray(right)) {
        throw new Error('Right side of "in" must be an array');
      }
      return right.includes(left);
    }
    return left;
  }

  private parseComparison(): ExprValue {
    const left = this.parseUnary();
    const token = this.current();
    if (token.type === TokenType.Operator) {
      const op = this.advance().value;
      const right = this.parseUnary();
      return this.compare(left, op, right);
    }
    return left;
  }

  private parseUnary(): ExprValue {
    if (this.current().type === TokenType.Not) {
      this.advance();
      const value = this.parseUnary();
      return !value;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExprValue {
    const token = this.current();

    switch (token.type) {
      case TokenType.String:
        this.advance();
        return token.value;

      case TokenType.Number:
        this.advance();
        return parseFloat(token.value);

      case TokenType.Boolean:
        this.advance();
        return token.value === 'true';

      case TokenType.FormValue:
        this.advance();
        return this.resolver(token.value);

      case TokenType.LParen: {
        this.advance();
        const inner = this.parseOr();
        if (this.current().type !== TokenType.RParen) {
          throw new Error('Expected closing parenthesis');
        }
        this.advance();
        return inner;
      }

      case TokenType.LBracket:
        return this.parseArray();

      default:
        throw new Error(`Unexpected token "${token.value}" (type ${token.type})`);
    }
  }

  private parseArray(): ExprValue[] {
    if (this.current().type !== TokenType.LBracket) {
      throw new Error('Expected "[" for array literal');
    }
    this.advance();

    const items: ExprValue[] = [];
    if (this.current().type !== TokenType.RBracket) {
      items.push(this.parsePrimary());
      while (this.current().type === TokenType.Comma) {
        this.advance();
        items.push(this.parsePrimary());
      }
    }

    if (this.current().type !== TokenType.RBracket) {
      throw new Error('Expected "]" to close array literal');
    }
    this.advance();
    return items;
  }

  private compare(left: ExprValue, op: string, right: ExprValue): boolean {
    switch (op) {
      case '===':
      case '==': return left === right;
      case '!==':
      case '!=': return left !== right;
      case '>': return Number(left) > Number(right);
      case '<': return Number(left) < Number(right);
      case '>=': return Number(left) >= Number(right);
      case '<=': return Number(left) <= Number(right);
      default: return false;
    }
  }
}

export function evaluateExpression(expression: string, resolver: ValueResolver): boolean {
  const tokens = tokenize(expression);
  const parser = new Parser(tokens, resolver);
  const result = parser.parse();
  return !!result;
}
