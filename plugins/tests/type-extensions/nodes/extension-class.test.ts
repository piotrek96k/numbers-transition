import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { expect, it } from 'vitest';
import { transformer } from '../transformer/transformer';

const extensionPath: string = resolve(dirname(dirname(fileURLToPath(import.meta.url))), 'extensions', 'extensions.ts');
const transform: (code: string, id?: string) => string = transformer(extensionPath);

it<object>('not rewrite static method this', (): void => {
  const code: string = `
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
      public static capitalize(value: string): string {
        return \`\${value[0].toUpperCase()}\${value.slice(1)}\`;
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
      public static capitalize\(value: string\): string {
        return \`\${value\[0\]\.toUpperCase\(\)}\${value\.slice\(1\)}\`;
      }
    }
  `;

  expect<string>(transform(code, extensionPath).compact()).toMatch(RegExp(expectedOutput.compact()));
});

it<object>('rewrite method this', (): void => {
  const code: string = `
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
      public capitalize(): string {
        return \`\${this.value[0].toUpperCase()}\${this.value.slice(1)}\`;
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
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
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
      public capitalize(): string {
        const capitalizer = () => \`\${this.value[0].toUpperCase()}\${this.value.slice(1)}\`;
        return capitalizer();
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
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
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
      public capitalize(): string {
        function capitalizer() {
          return \`\${this.value[0].toUpperCase()}\${this.value.slice(1)}\`;
        }

        return capitalizer.call(this);
      }
    }
  `;

  const expectedOutput: string = String.raw`
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
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
    import Extension, { ExtensionConstructor } from 'type-extensions/extension';

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
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
    import Extension, { ExtensionConstructor }from 'type-extensions/extension';

    .*

    class CharSequence extends Extension<string> implements ExtensionConstructor<string, typeof CharSequence> {
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
