import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { expect, it } from 'vitest';
import { transformer } from '../transformer/transformer';

const extensionPath: string = resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'extensions', 'extensions.ts');
const transform: (code: string, ide?: string) => string = transformer(extensionPath);

it<object>('generate runtime methods', (): void => {
  const code: string = `
    import Extension from 'type-extensions/extension';
  `;

  const expectedOutput: string = String.raw`
    import Extension from 'type-extensions/extension';

    const getThisValue[0-9a-f]+ = \(self, type\) => self instanceof type \? self : new type\(self\);
    
    const typeMap[0-9a-f]+ = new Map\(
      \[
        \["Boolean", Predicate\],
        \["Number", Double\],
        \["BigInt", Long\],
        \["String", CharSequence\],
        \["RegExp", Pattern\],
        \["Object", Struct\],
        \["Array", List\]
      \]
    \),

    defaultTypes[0-9a-f]+ = \[\.\.\.typeMap[0-9a-f]+\.keys\(\)\]\.flatMap\(id => \[{ id, isStatic: false }, { id, isStatic: true }\]\),

    readSources[0-9a-f]+ = value => { 
      const sources = \[\]; 
      while \(value && value !== Object\.prototype\) { 
        sources\.push\(value\); 
        value = Object\.getPrototypeOf\(value\); 
      } 
      return sources; 
    },

    typeDistance[0-9a-f]+ = \(value, { id, isStatic }\) => {
      const type = typeMap[0-9a-f]+\.get\(id\)\.type,
      found = isStatic \? type : type\.prototype;
      let distance = 0;
      while \(value && value !== Object\.prototype\ && value !== found\) {
        value = Object\.getPrototypeOf\(value\);
        distance\+\+;
      }
      return distance;
    },

    findOwnerDistance[0-9a-f]+ = \(value, key\) => {
      let distance = 0;
      while \(value && !Object\.prototype\.hasOwnProperty\.call\(value, key\)\) {
        value = Object\.getPrototypeOf\(value\);
        distance\+\+;
      }
      return distance;
    },

    getExtension[0-9a-f]+ = \(value, { id, isStatic }\) => isStatic \? typeMap[0-9a-f]+\.get\(id\) : new \(typeMap[0-9a-f]+\.get\(id\)\)\(value\);

    export const wrap[0-9a-f]+ = \(value, types, key\) => {
      const \[type, distance\] = types\.map\(type => \[type, typeDistance[0-9a-f]+\(value, type\)\]\)\.sort\(\(\[, first\], \[, second\]\) => first - second\)\[0\];
      return value\?\.\[key\] === void 0 \|\| findOwnerDistance[0-9a-f]+\(value, key\) > distance \? getExtension[0-9a-f]+\(value, type\) : value;
    },

    merge[0-9a-f]+ = \(value, types\) => { 
      const object = Object\.create\(Object\.getPrototypeOf\(value\)\); 
      Object\.defineProperties\(object, Object\.getOwnPropertyDescriptors\(Object\(value\)\)\); 
      const properties = types
        \.map\(type => \[readSources[0-9a-f]+\(getExtension[0-9a-f]+\(value, type\)\), typeDistance[0-9a-f]+\(value, type\)\]\)
        \.flatMap\(\(\[sources, distance\]\) =>
          sources\.flatMap\(\(source, index\) =>
            Object\.getOwnPropertyNames\(source\)
              \.filter\(key => key \!== "constructor"\)
              \.map\(key => \[key, distance, index, Object\.getOwnPropertyDescriptor\(source, key\)\]\)
          \)
        \)
        \.sort\(\(first, second\) => first\[0\]\.localeCompare\(second\[0\]\) \|\| second\[1\] - first\[1\] \|\| second\[2\] - first\[2\]\)
        \.reduce\(\(map, entry\) => map\.set\(entry\[0\], entry\), new Map\(\)\);
      \[\.\.\.properties\.values\(\)\]
        \.filter\(\(\[key, distance\]\) => \!\(key in object\) \|\| findOwnerDistance[0-9a-f]+\(value, key\) > distance\)
        \.forEach\(\(\[key, , , descriptor\]\) => Object\.defineProperty\(object, key, descriptor\)\);
      return object;
    },

    proxy[0-9a-f]+ = \(value, types = defaultTypes[0-9a-f]+, key\) => { 
      const found = types\.filter\(\({ id, isStatic }\) => {
        const type = typeMap[0-9a-f]+\.get\(id\);
        return isStatic 
          \? value === type\.type \|\| typeof type\.type === "function" && value\.prototype instanceof type\.type
          : type\.isType\(value\);
      }\);
      return found\.length \? key \!== void 0 \? wrap[0-9a-f]+\(value, found, key\) : merge[0-9a-f]+\(value, found\) : value;
    };
  `;

  expect<string>(transform(code, extensionPath).compact()).toMatch(RegExp(expectedOutput.compact()));
});
