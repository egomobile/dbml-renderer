[![npm version](https://img.shields.io/npm/v/@egomobile/dbml-renderer)](https://www.npmjs.com/package/@egomobile/dbml-renderer) ![.github/workflows/publish.yml](https://github.com/egomobile/dbml-renderer/actions/workflows/publish.yml/badge.svg)

# @egomobile/dbml-renderer

`dbml-renderer` renders [DBML](https://www.dbml.org/home/) files to SVG images.

> The tool was orginally implemented as CLI tool by [softwaretechnik.berlin
](https://github.com/softwaretechnik-berlin/dbml-renderer).

## Install

```bash
npm install @egomobile/dbml-renderer
```

For instance, the following code will produce the image below:

```typescript
import { parseDMBL } from "@egomobile/dbml-renderer";

const dbml = `Table users {
    id integer
    username varchar
    role varchar
    created_at timestamp
}

Table posts {
    id integer [primary key]
    title varchar
    body text [note: 'Content of the post']
    user_id integer
    created_at timestamp
}

Ref: posts.user_id > users.id`

console.log(
    parseDMBL(dbml, "svg")
);
```

![Posts example output](examples/user-posts.dbml.svg)

The [examples directory](examples/) contains other input and output examples.

## Testing

The tests can be run with `npm test`. They use the examples available in the
`examples` directory. Each `.dbml` file is used as input to render each of the
available output formats.

The output of a test run is placed in `.test-output`. In case the renderer has
been modified, the test output can be visually inspected and, confirmed the
output is good, the expectations can be updated by copying them with the
following command:

```bash
cp .test-output/* examples/
```

To aid the visual inspection, you can open `.compare-test-output.html` to
compare side-by-side each generated SVG.
