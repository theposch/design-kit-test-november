# Fixtures

Sample pictures and data that only stories use: an avatar, a product photo, a list of names. Import them with the `#fixtures/*` path from any story:

```tsx
import avatar from '#fixtures/avatar.png';
```

Components never import from here: they take pictures and data through props. Pictures a page or prototype really shows belong beside that page, not here.
