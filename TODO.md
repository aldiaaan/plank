# TODO

## TypeScript dual-alias workaround

`package.json` currently uses two TypeScript installs:

```json
{
  "devDependencies": {
    "typescript": "npm:@typescript/typescript6@^6.0.2",
    "@typescript/native": "npm:typescript@^7.0.2"
  }
}
```

- `typescript` → TypeScript 6 API for `typescript-eslint` (linting)
- `@typescript/native` → TypeScript 7 `tsc` binary for builds

`@typescript/native` is not a real package. It is an npm alias that installs `typescript@^7.0.2` under a different name so we can keep both:

- `require("typescript")` resolves to the TS 6 API for ESLint tooling
- `tsc` resolves to TS 7 for `build` and `typecheck`

This follows the transition pattern from the [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

### Follow-up

- [ ] Remove the dual-alias setup once `typescript-eslint` supports TypeScript 7
- [ ] Switch back to a single `typescript` dependency when tooling no longer needs the TS 6 API