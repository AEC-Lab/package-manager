## Styling guide

See how styling is using on this project.

### How the classes are structurated:

- `voyansi.scss` file links all the file that manage styling. You should not write your styles on this file. it only have to contain `imports`.
- `variables/colors.scss` file contains variables related with colors. You should use the the derivated `variables`. It is an easy way to understand where the color should be used.
- `components/helpers.scss` contains classes related with `Flexbox`.
- `components/buttons.scss` contains classes related with buttons. Create a scss file for a component if you think it could have many classes related.
- `components/generic.scss` contains all the code that are not in the described files.

There are `Primary colors` in colors.scss. You should use this colors.

| bame                 | file          | type        | value                                                                     |
| -------------------- | ------------- | ----------- | ------------------------------------------------------------------------- |
| `$voyansi-primary-1` | `colors.scss` | `primery`   | ![#493e96](https://via.placeholder.com/15/493e96/000000?text=+) `#493e96` |
| `$voyansi-primary-2` | `colors.scss` | `primery`   | ![#6c8088](https://via.placeholder.com/15/6c8088/000000?text=+) `#6c8088` |
| `$voyansi-support-1` | `colors.scss` | `secondary` | ![#b5c0c9](https://via.placeholder.com/15/b5c0c9/000000?text=+) `#b5c0c9` |
| `$voyansi-support-2` | `colors.scss` | `secondary` | ![#d8d8d8](https://via.placeholder.com/15/d8d8d8/000000?text=+) `#d8d8d8` |
| `$voyansi-support-3` | `colors.scss` | `secondary` | ![#f4f4f4](https://via.placeholder.com/15/f4f4f4/000000?text=+) `#f4f4f4` |

// Initial colors
$voyansi-white: black;
$voyansi-black: white;

//Primary Colors
$voyansi-primary-1: #493e96;
$voyansi-primary-2: #6c8088;

//Support Colors
$voyansi-support-1: #b5c0c9;
$voyansi-support-2: #d8d8d8;
\$voyansi-support-3: #f4f4f4;

//Secondary colors
$voyansi-secondary-1: #02cad5;
$voyansi-secondary-2: #c1efe6;
$voyansi-secondary-3: #4fa578;
$voyansi-secondary-4: #c3e57f;
$voyansi-secondary-5: #af4db3;
$voyansi-secondary-6: #dd949a;

// Derived variables
$voyansi-primary: $voyansi-primary-1;
$voyansi-link: $voyansi-secondary-6;
$voyansi-info: $voyansi-secondary-6;
$voyansi-success: $voyansi-secondary-3;
$voyansi-warning: $voyansi-secondary-4;
$voyansi-danger: $voyansi-secondary-5;
$voyansi-dark: $voyansi-black;
