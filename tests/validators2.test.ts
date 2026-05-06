import { describe, it, expect, expectTypeOf } from 'vitest';
import { getValidator, registerDefaultValidators, runValidators } from '../src/forms/validators/index';
import type { ValidatorRule, Validator } from '../src/forms/types';




describe("VALIDATORS: running default validators works", ()=>{
  registerDefaultValidators();

  describe("Registry", ()=>{
    it("Registry contains NotEmpty Validator", ()=>{
      const validator=getValidator("NotEmpty");
      expect(validator).not.toBeUndefined();
      if(!validator) return;
      expect(validator.type).toBe("NotEmpty");
      expect(validator.validate).toBeTypeOf("function");
    })
  })

  describe("NotEmptyValidator", ()=>{
    const rules: ValidatorRule[]=[{type: "NotEmpty"}]

    it("fails on empty string", ()=>{
      const result=runValidators(rules, "");
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe("This field is required.")
    })


  })
})