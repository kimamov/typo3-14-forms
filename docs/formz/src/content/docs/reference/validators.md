---
title: Validators
description: API reference for the validator system.
---

## Registration

```typescript
import { registerDefaultValidators, registerValidator, formRegistry } from 'formz';

// Register all 12 built-in validators at once
registerDefaultValidators();

// Register a single custom validator
registerValidator({
  type: 'MyValidator',
  validate(value, options) {
    return { valid: true, message: '' };
  },
});

// Or via the registry
formRegistry.registerValidator({ type: 'Other', validate: ... });
```

## Validator Interface

```typescript
interface Validator {
  type: string;
  validate(
    value: string,
    options: Record<string, unknown>
  ): ValidatorResult | Promise<ValidatorResult>;
}

interface ValidatorResult {
  valid: boolean;
  message: string;
}
```

The `type` must match the `type` field in `data-validate` JSON rules.

## Built-in Validators

| Type | Options | Passes on empty? |
|------|---------|-----------------|
| `NotEmpty` | `message` | No |
| `StringLength` | `minimum`, `maximum`, `message` | Yes |
| `EmailAddress` | `message` | Yes |
| `RegularExpression` | `regularExpression` (PCRE delimited), `message` | Yes |
| `NumberRange` | `minimum`, `maximum`, `message` | Yes |
| `Integer` | `message` | Yes |
| `Float` | `message` | Yes |
| `Number` | `message` | Yes |
| `Alphanumeric` | `message` | Yes |
| `DateTime` | `message` | Yes |
| `DateRange` | `minimum`, `maximum`, `message` | Yes |
| `FileSize` | `minimum`, `maximum` (e.g. `"5M"`), `message` | Yes |

Most validators pass on empty values by design. Combine with `NotEmpty` for required fields.

## ValidatorRule (HTML format)

```typescript
interface ValidatorRule {
  type: string;
  options?: Record<string, unknown>;
}
```

Used in HTML as a JSON array:

```html
<div data-validate='[
  {"type":"NotEmpty","options":{"message":"Required"}},
  {"type":"StringLength","options":{"minimum":3}}
]'>
```

## Running Validators Programmatically

```typescript
import { runValidators, runValidatorsAsync } from 'formz/forms/validators';

// Synchronous (skips async validators with a warning)
const results = runValidators(rules, value);

// Async (awaits each validator)
const results = await runValidatorsAsync(rules, value);
```

Both return an array of failed `ValidatorResult` objects.
