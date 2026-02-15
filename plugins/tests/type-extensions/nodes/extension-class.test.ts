import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { expect, it } from 'vitest';
import { transform } from '../transform/transform';

const extensionPath: string = resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'extensions', 'extensions.ts');

it<object>('generate runtime methods', (): void => {
  const code: string = `
    import Extension from 'type-extensions/extension';
  `;

  const expectedOutput: string = String.raw`
    import Extension from 'type-extensions/extension';

    const getThisValue[0-9a-f]+ = \(self, cls\) => self instanceof cls \? self : new cls\(self\);
    
    const typeMap[0-9a-f]+ = new Map\(
      \[
        \["Boolean", Predicate\],
        \["Number", Double\],
        \["BigInt", Long\],
        \["String", CharSequence\],
        \["RegExp", Pattern\],
        \["Array", List\],
        \["Object", Struct\]
      \]
    \),

    readSources[0-9a-f]+ = extension => { 
      const sources = \[extension\]; 
      let prototype = Object\.getPrototypeOf\(extension\); 
      while \(prototype && prototype !== Object\.prototype\) { 
        sources\.unshift\(prototype\); 
        prototype = Object\.getPrototypeOf\(prototype\); 
      } 
      return sources; 
    };

    export const wrap[0-9a-f]+ = \(value, cls, key\) => value\?.\[key\] === void 0 \? new \(typeMap[0-9a-f]+\.get\(cls\)\)\(value\) : value,

    merge[0-9a-f]+ = \(value, cls\) => { 
      const object = Object\.create\(Object\.getPrototypeOf\(value\)\); 
      Object\.defineProperties\(object, Object\.getOwnPropertyDescriptors\(Object\(value\)\)\); 
      const descriptions = Object\.assign\(
        {}, 
        \.\.\.readSources[0-9a-f]+\(new \(typeMap[0-9a-f]+\.get\(cls\)\)\(value\)\)\.map\(source => 
          Object\.fromEntries\(
            Object\.getOwnPropertyNames\(source\)
              \.filter\(key => key !== "constructor" && !\(key in object\)\)
              \.map\(key => \[key, Object\.getOwnPropertyDescriptor\(source, key\)\]\)
          \)
        \)
      \); 
      return Object\.defineProperties\(object, descriptions\);
    },

    proxy[0-9a-f]+ = \(value, classes, key\) => { 
      const type = classes\.find\(cls => typeMap[0-9a-f]+\.get\(cls\).isType\(value\)\); 
      return type \? key \? wrap[0-9a-f]+\(value, type, key\): merge[0-9a-f]+\(value, type\): value; 
    };
  `;

  expect<string>(transform(code, extensionPath).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite method this', (): void => {
  const code: string = `
    import Extension from 'type-extensions/extension';

    class CharSequence extends Extension<string> {
      public capitalize(): string {
        return \`\${this.value[0].toUpperCase()}\${this.value.slice(1)}\`;
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> {
      public capitalize\(\): string {
        const self[0-9a-f]+ = getThisValue[0-9a-f]+\(this, CharSequence\);
        return \`\${self[0-9a-f]+\.value\[0\]\.toUpperCase\(\)}\${self[0-9a-f]+\.value\.slice\(1\)}\`;
      }
    }
  `;

  expect<string>(transform(code, extensionPath).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite nested arrow function this', (): void => {
  const code: string = `
    import Extension from 'type-extensions/extension';

    class CharSequence extends Extension<string> {
      public capitalize(): string {
        const capitalizer = () => \`\${this.value[0].toUpperCase()}\${this.value.slice(1)}\`;
        return capitalizer();
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> {
      public capitalize\(\): string {
        const self[0-9a-f]+ = getThisValue[0-9a-f]+\(this, CharSequence\);
        const capitalizer = \(\) => \`\${self[0-9a-f]+\.value\[0\]\.toUpperCase\(\)}\${self[0-9a-f]+\.value\.slice\(1\)}\`;
        return capitalizer\(\);
      }
    }
  `;

  expect<string>(transform(code, extensionPath).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('not rewrite nested function this', (): void => {
  const code: string = `
    import Extension from 'type-extensions/extension';

    class CharSequence extends Extension<string> {
      public capitalize(): string {
        function capitalizer() {
          return \`\${this.value[0].toUpperCase()}\${this.value.slice(1)}\`;
        }

        return capitalizer.call(this);
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> {
      public capitalize\(\): string {
        const self[0-9a-f]+ = getThisValue[0-9a-f]+\(this, CharSequence\);
        function capitalizer\(\) {
          return \`\${this\.value\[0\]\.toUpperCase\(\)}\${this\.value\.slice\(1\)}\`;
        }

        return capitalizer.call\(self[0-9a-f]+\);
      }
    }
  `;

  expect<string>(transform(code, extensionPath).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('not rewrite nested class this', (): void => {
  const code: string = `
    import Extension from 'type-extensions/extension';

    class CharSequence extends Extension<string> {
      public capitalize(): string {
        class Capitalizer {
          private readonly value: CharSequence;
          constructor(value: CharSequence) {
            this.value = value;
          }
          public readonly capitalized = (): string => \`\${this.value.value[0].toUpperCase()}\${this.value.value.slice(1)}\`;
        }

        return new Capitalizer(this).capitalized();
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> {
      public capitalize\(\): string {
        const self[0-9a-f]+ = getThisValue[0-9a-f]+\(this, CharSequence\);
        class Capitalizer {
          private readonly value: CharSequence;
          constructor\(value: CharSequence\) {
            this\.value = value;
          }
          public readonly capitalized = \(\): string => \`\${this\.value\.value\[0\]\.toUpperCase\(\)}\${this\.value\.value\.slice\(1\)}\`;
        }

        return new Capitalizer\(self[0-9a-f]+\)\.capitalized\(\);
      }
    }
  `;

  expect<string>(transform(code, extensionPath).compact()).toMatch(RegExp(expectedOutput.compact()));
});
