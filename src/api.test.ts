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

import test from "ava";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { run } from "./api";
import { Format } from "./renderer";

const examplesDir = "examples";
const testOutputDir = ".test-output";
const formats: Format[] = ["dot", "svg"];

mkdirSync(testOutputDir, { recursive: true });

const dbmlFiles = readdirSync(examplesDir)
  .filter((file) => {
    return file.endsWith(".dbml");
  })
  .filter((file) => {
    return !file.startsWith("_");
  })
  .map((dbmlFilename) => {
    return [dbmlFilename, join(examplesDir, dbmlFilename)];
  });

dbmlFiles.forEach(([dbmlFilename, dbmlFile]) => {
  const input = readFileSync(dbmlFile, "utf-8");
  const outputFile = (format: Format) => {
    return join(testOutputDir, `${dbmlFilename}.${format}`);
  };

  formats.forEach((format) => {
    test(`${dbmlFile} can be converted to ${format}`, (t) => {
      const output = run(input, format);

      writeFileSync(outputFile(format), output, "utf-8");

      t.pass();
    });

    test(`${dbmlFile} ${format} output is consistent`, async (t) => {
      const expectedOutput = readFile(`${dbmlFile}.${format}`, "utf-8");
      const currentOutput = readFile(outputFile(format), "utf-8");

      await t.notThrowsAsync(expectedOutput);
      await t.notThrowsAsync(currentOutput);

      t.deepEqual(await currentOutput, await expectedOutput);
    });
  });
});

const comparisonPage =
  `
  <style>
    table {
      width: 100%;
    }
    table, th, td {
      border: 1px solid black;
      border-collapse: collapse;
    }
    img {
      width: 100%;
      height: auto;
    }
  </style>
` +
  dbmlFiles
    .map(([dbmlFilename, dbmlFile]) => {
      return `<div>
    <h2 id="${dbmlFilename}">${dbmlFilename}</h2>
    <table>
      <tr>
        <th>Expected</th>
        <th>Current</th>
      </tr>
      <tr>
        <td><img src="${dbmlFile}.svg" /></td>
        <td><img src="${join(testOutputDir, dbmlFilename)}.svg" /></td>
      </tr>
    </table>
  </div>
  `;
    })
    .join("\n");

writeFileSync(".compare-test-output.html", comparisonPage, "utf-8");
