## Voyansi Styling guide

See how styling is using on Voyansi Package Manager.

### How the classes are structurated:

- `voyansi.scss` file links all the file that manage styling. You should not write your styles on this file. it only have to contain `imports`.
- `variables/colors.scss` file contains variables related with colors. You should use the the derivated `variables`. It is an easy way to understand where the color should be used.
- `components/helpers.scss` contains classes related with `Flexbox`.
- `components/buttons.scss` contains classes related with buttons. Create a scss file for a component if you think it could have many classes related.
- `components/generic.scss` contains all the code that are not in the described files.

There are `Initial colors`, `Primary colors`, `Secondary colors`, and `Derivated colors` in colors.scss. You should use `Derivated colors`.

| name                   | file          | type        | value                                                                       |
| ---------------------- | ------------- | ----------- | --------------------------------------------------------------------------- |
| `$voyansi-white`       | `colors.scss` | `initial`   | ![#FFFFFF](https://via.placeholder.com/15/FFFFFF/000000?text=+) `#FFFFFF`   |
| `$$voyansi-black`      | `colors.scss` | `initial`   | ![##000000](https://via.placeholder.com/15/#000000/000000?text=+) `#000000` |
| `$voyansi-primary-1`   | `colors.scss` | `primery`   | ![#493e96](https://via.placeholder.com/15/493e96/000000?text=+) `#493e96`   |
| `$voyansi-primary-2`   | `colors.scss` | `primery`   | ![#6c8088](https://via.placeholder.com/15/6c8088/000000?text=+) `#6c8088`   |
| `$voyansi-support-1`   | `colors.scss` | `support`   | ![#b5c0c9](https://via.placeholder.com/15/b5c0c9/000000?text=+) `#b5c0c9`   |
| `$voyansi-support-2`   | `colors.scss` | `support`   | ![#d8d8d8](https://via.placeholder.com/15/d8d8d8/000000?text=+) `#d8d8d8`   |
| `$voyansi-support-3`   | `colors.scss` | `support`   | ![#f4f4f4](https://via.placeholder.com/15/f4f4f4/000000?text=+) `#f4f4f4`   |
| `$voyansi-secondary-1` | `colors.scss` | `secondary` | ![#02cad5](https://via.placeholder.com/15/02cad5/000000?text=+) `#02cad5`   |
| `$voyansi-secondary-2` | `colors.scss` | `secondary` | ![#c1efe6](https://via.placeholder.com/15/c1efe6/000000?text=+) `#c1efe6`   |
| `$voyansi-secondary-3` | `colors.scss` | `secondary` | ![#4fa578](https://via.placeholder.com/15/4fa578/000000?text=+) `#4fa578`   |
| `$voyansi-secondary-4` | `colors.scss` | `secondary` | ![#c3e57f](https://via.placeholder.com/15/c3e57f/000000?text=+) `#c3e57f`   |
| `$voyansi-secondary-5` | `colors.scss` | `secondary` | ![#af4db3](https://via.placeholder.com/15/af4db3/000000?text=+) `#af4db3`   |
| `$voyansi-secondary-6` | `colors.scss` | `secondary` | ![#dd949a](https://via.placeholder.com/15/dd949a/000000?text=+) `#dd949a`   |

### Derived variables

- `$voyansi-primary` ![#493e96](https://via.placeholder.com/15/493e96/000000?text=+) `#493e96`
- `$voyansi-link` ![#dd949a](https://via.placeholder.com/15/dd949a/000000?text=+) `#dd949a`
- `$voyansi-info` ![#d8d8d8](https://via.placeholder.com/15/d8d8d8/000000?text=+) `#d8d8d8`
- `$voyansi-success` ![#4fa578](https://via.placeholder.com/15/4fa578/000000?text=+) `#4fa578`
- `$voyansi-warning` ![#c3e57f](https://via.placeholder.com/15/c3e57f/000000?text=+) `#c3e57f`
- `$voyansi-danger` ![#af4db3](https://via.placeholder.com/15/af4db3/000000?text=+) `#af4db3`
- `$voyansi-dark` ![#000000](https://via.placeholder.com/15/000000/000000?text=+) `#000000`
