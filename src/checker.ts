/// Copyright 2023 softwaretechnik.berlin
/// https://github.com/softwaretechnik-berlin/dbml-renderer/blob/ca0302a91d26abc9f13b23da523c2d1a312f9c31/package.json#L22C7-L22C7
///
/// Permission to use, copy, modify, and/or distribute this software for any
/// purpose with or without fee is hereby granted, provided that the above
/// copyright notice and this permission notice appear in all copies.
///
/// THE SOFTWARE IS PROVIDED “AS IS” AND THE AUTHOR DISCLAIMS ALL WARRANTIES
/// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
/// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
/// SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
/// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
/// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
/// IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

import { SimplifiedTableRef, tableName } from "./common";
import { parse } from "./parser";
import {
  Column,
  ColumnRef,
  Enum,
  Output,
  Project,
  Ref,
  Table,
  TableGroup,
  TableIndices,
} from "./types";

export const check = (input: Output): NormalizedOutput => {
  const tables = extract("table", input).map((table) => {
    return {
      actual: table,
      columns: extract("column", table.items),
      indices: extract("indices", table.items)[0],
      options: extract("option", table.items).reduce((acc, i) => {
        return { ...acc, ...i.option };
      }, {}),
    };
  });

  const inlinedRefs = tables.flatMap((table) => {
    return table.columns.flatMap((column) => {
      const ref = column.settings["ref"];
      if (!ref) {
        return [];
      }

      // create a virtual ref, parse it and add it to the list of refs
      const virtualRef = `Ref: ${tableName(table.actual)}.${
        column.name
      } ${ref}`;
      return extract("ref", parse(virtualRef));
    });
  });

  const groupedTables = new Set<string>();
  const groups = extract("group", input).map((group) => {
    return {
      actual: group,
      tables: extract("table", group.items).map((i) => {
        const table = resolveTable(i, tables);
        const name = tableName(table.actual);
        if (!groupedTables.add(name)) {
          throw new Error(`Table ${i.name} belongs to multiple groups`);
        }

        return table;
      }),
    };
  });

  const ungroupedTables = tables.filter((t) => {
    return !groupedTables.has(tableName(t.actual));
  });

  const refs = extract("ref", input)
    .concat(inlinedRefs)
    .map((ref) => {
      return {
        actual: ref,
        from: extractColumns(ref.from, tables),
        to: extractColumns(ref.to, tables),
      };
    });

  return {
    project: extract("project", input)[0],
    ungroupedTables,
    groups,
    refs,
    enums: extract("enum", input).map((e) => {
      return {
        actual: e,
        values: extract("value", e.items).map((v) => {
          return v.name;
        }),
      };
    }),
  };
};

export type NormalizedTable = {
  actual: Table;
  columns: Column[];
  indices?: TableIndices;
  options: Record<string, string>;
};

export type NormalizedGroup = {
  actual: TableGroup;
  tables: NormalizedTable[];
};

export type NormalizedEnum = {
  actual: Enum;
  values: string[];
};

export type NormalizedRef = {
  actual: Ref;
  from: ReferredColumns;
  to: ReferredColumns;
};

export type ReferredColumns = {
  table: NormalizedTable;
  columns: Column[];
};

export type NormalizedOutput = {
  project?: Project;
  ungroupedTables: NormalizedTable[];
  groups: NormalizedGroup[];
  refs: NormalizedRef[];
  enums: NormalizedEnum[];
};

const resolveTable = (
  ref: SimplifiedTableRef,
  tables: NormalizedTable[],
): NormalizedTable => {
  const table = tables.find((t) => {
    return (
      ref.schema === t.actual.schema &&
      (ref.name === t.actual.name || ref.name === t.actual.alias)
    );
  });

  if (!table) {
    throw new Error(`Table ${tableName(ref)} does not exist`);
  }

  return table;
};

const extract = <E extends { type: string }, T extends E["type"]>(
  type: T,
  entries: E[],
): Extract<E, { type: T }>[] => {
  return entries.filter((e) => {
    return e.type === type;
  }) as Extract<E, { type: T }>[];
};

const extractColumns = (
  ref: ColumnRef,
  tables: NormalizedTable[],
): ReferredColumns => {
  const table = resolveTable(ref, tables);

  return {
    table,
    columns: ref.columns.map((c) => {
      const column = table.columns.find((i) => {
        return i.name === c;
      });
      if (!column) {
        throw new Error(
          `Column ${c} does not exist in table ${tableName(table.actual)}`,
        );
      }
      return column;
    }),
  };
};
