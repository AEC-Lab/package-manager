## Styling guide

See how styling is using on this project.

### How the classes are structurated:

- `voyansi.scss` file links all the file that manage styling. You should not write your styles on this file. it only have to contain `imports`.
- `colors.scss` file contains variables related with colors. You should use the the derivated `variables`. It is an easy way to understand where the color should be used.
- `helpers.scss` contains classes related with `Flexbox`.
- `buttons.scss` contains classes related with buttons. Create a scss file for a component if you think it could have many classes related.
- `genric.scss` contains all the code that are not in the described files.

There are derivated variables in colors.scss. You should use this colors.

| variable             | file          | value                                                                     |
| -------------------- | ------------- | ------------------------------------------------------------------------- |
| `$voyansi-primary-1` | `colors.scss` | [#493e96](https://via.placeholder.com/15/493e96/000000?text=+) `#493e96`  |
| `$voyansi-primary-2` | `colors.scss` | ![#6c8088](https://via.placeholder.com/15/6c8088/000000?text=+) `#6c8088` |
