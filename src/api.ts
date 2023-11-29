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

import { check } from "./checker";
import { parse } from "./parser";
import { Format, render } from "./renderer";

export const run = (input: string, format: Format): string => {
  return render(check(parse(input)), format);
};
