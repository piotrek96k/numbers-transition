# NumbersTransition

[![npm version](https://img.shields.io/npm/v/numbers-transition.svg?style=flat)](https://www.npmjs.com/package/numbers-transition)
[![Storybook Deployment](https://github.com/piotrek96k/numbers-transition/actions/workflows/storybook.yaml/badge.svg)](https://github.com/piotrek96k/numbers-transition/actions/workflows/storybook.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

---

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Peer Dependencies](#peer-dependencies)
  - [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
  - [initialValue](#initialvalue)
  - [value](#value)
  - [precision](#precision)
  - [digitGroupSeparator](#digitgroupseparator)
  - [decimalSeparator](#decimalseparator)
  - [negativeCharacter](#negativecharacter)
  - [negativeCharacterAnimationMode](#negativecharacteranimationmode)
  - [animationDuration](#animationduration)
- [Types](#types)
  - [UncheckedBigDecimal](#uncheckedbigdecimal)
  - [BigDecimal](#bigdecimal)
  - [DigitGroupSeparatorCharacter](#digitgroupseparatorcharacter)
  - [DecimalSeparatorCharacter](#decimalseparatorcharacter)
  - [NegativeCharacter](#negativecharacter-1)
  - [NegativeCharacterAnimationMode](#negativecharacteranimationmode-1)
  - [AnimationDuration](#animationduration-1)
  - [TotalAnimationDuration](#totalanimationduration)
- [License](#license)

---

## Introduction

**numbers-transition** is a TypeScript/React library that provides the **NumbersTransition** component for smooth transition animations between numbers. You can see live examples in the [Storybook](https://piotrek96k.github.io/numbers-transition/).

---

## Getting Started

### Prerequisites

- Node.js ≥ 16.x
- npm or yarn/pnpm
- React 18+
- styled-components 6

### Peer Dependencies

- react
- react-dom
- styled-components

### Installation

- ```bash
  npm install numbers-transition
  ```
- ```bash
  yarn add numbers-transition
  ```

---

## Usage

The transition is triggered by a change of the [value](#value) prop.
The minimal configuration required for the component to work is:

```tsx
import NumbersTransition from 'numbers-transition';

const Example: FC = () => {
  const [value, setValue] = useState<number>(0);

  return (
    <>
      <button onClick={() => setValue((previous) => previous + 1_000_000)}>Add Million</button>
      <NumbersTransition value={value} />
    </>
  );
};
```

---

## Props

### `initialValue`

- **Type:** <code>[UncheckedBigDecimal](#uncheckedbigdecimal) | [BigDecimal](#bigdecimal) | undefined</code>
- **Default:** `0`
- **Description:** Initial value of <code>[value](#value)</code> prop to trigger transition on first render. If <code>[initialValue](#initialvalue)</code> matches <code>[value](#value)</code>, no initial animation is displayed.

### `value`

- **Type**: <code>[UncheckedBigDecimal](#uncheckedbigdecimal) | [BigDecimal](#bigdecimal) | undefined</code>
- **Default:** `0`
- **Description:** The value to display. Its change triggers the transition between the previous and new value.

### `precision`

- **Type:** `number | undefined`
- **Default:** `0`
- **Description:** Precision of the displayed number.
  - If precision is greater than zero, it represents the number of digits after the decimal point.
  - If precision is negative, it represents the number of decimal places to round to.

### `digitGroupSeparator`

- **Type:** <code>[DigitGroupSeparatorCharacter](#digitgroupseparatorcharacter) | undefined</code>
- **Default:** <code>[DigitGroupSeparatorCharacter](#digitgroupseparatorcharacter).Space</code>
- **Description:** The digit group separator character to display.

### `decimalSeparator`

- **Type:** <code>[DecimalSeparatorCharacter](#decimalseparatorcharacter) | undefined</code>
- **Default:** The default <code>[decimalSeparator](#decimalseparator)</code> is determined based on <code>[digitGroupSeparator](#digitgroupseparator)</code>.
  - If <code>[digitGroupSeparator](#digitgroupseparator)</code> is <code>[DigitGroupSeparatorCharacter](#digitgroupseparatorcharacter).Comma</code>, then the <code>[decimalSeparator](#decimalseparator)</code> defaults to <code>[DecimalSeparatorCharacter](#decimalseparatorcharacter).Dot</code>.
  - Otherwise, it defaults to <code>[DecimalSeparatorCharacter](#decimalseparatorcharacter).Comma</code>.
- **Description**: The decimal separator character to display.

### `negativeCharacter`

- **Type:** <code>[NegativeCharacter](#negativecharacter-1) | undefined</code>
- **Default:** <code>[NegativeCharacter](#negativecharacter-1).Minus</code>
- **Description:** Negative character to display.

### `negativeCharacterAnimationMode`

- **Type:** <code>[NegativeCharacterAnimationMode](#negativecharacteranimationmode-1) | undefined</code>
- **Default:** <code>[NegativeCharacterAnimationMode](#negativecharacteranimationmode-1).Single</code>
- **Description:** Controls how the negative character is animated.
  - <code>[NegativeCharacterAnimationMode](#negativecharacteranimationmode-1).Single</code> displays one negative character that moves together with the rest of the animation.
  - <code>[NegativeCharacterAnimationMode](#negativecharacteranimationmode-1).Multi</code> displays multiple negative characters — one for each moving digit on the right.

### `animationDuration`

- **Type:** <code>[AnimationDuration](#animationduration-1) | [TotalAnimationDuration](#totalanimationduration) | undefined</code>
- **Default:** `{ horizontalAnimation: 2000, verticalAnimation: 5000 }`
- **Description:** Animation duration in milliseconds.
  - If the provided object is of type <code>[AnimationDuration](#animationduration-1)</code>, it sets the horizontal and vertical animation durations (if a duration is zero, that animation is skipped).
  - If the provided object is of type <code>[TotalAnimationDuration](#totalanimationduration)</code>, it sets the total duration of all animations and a ratio, which is the ratio of vertical animation duration to horizontal animation duration (ratio = 0 disables vertical animation; ratio = ∞ disables horizontal animation).

---

## Types

### `UncheckedBigDecimal`

```ts
type UncheckedBigDecimal = number | bigint | string;
```

### `BigDecimal`

```ts
type BigDecimal = number | bigint | `${number}`;
```

### `DigitGroupSeparatorCharacter`

```ts
enum DigitGroupSeparatorCharacter {
  None = '',
  Comma = ',', // \u002C
  Dot = '.', // \u002E
  ThinSpace = ' ', // \u2009
  Space = ' ', // \u0020
  Underscore = '_', // \u005F
  Apostrophe = "'", // \u0027
}
```

### `DecimalSeparatorCharacter`

```ts
enum DecimalSeparatorCharacter {
  Comma = ',', // \u002C
  Dot = '.', // \u002E
}
```

### `NegativeCharacter`

```ts
enum NegativeCharacter {
  Hyphen = '-', // \u002D
  HyphenMinus = '﹣', // \uFE63
  Minus = '−', // \u2212
  Dash = '–', // \u2013
}
```

### `NegativeCharacterAnimationMode`

```ts
enum NegativeCharacterAnimationMode {
  Single = 'single',
  Multi = 'multi',
}
```

### `AnimationDuration`

```ts
interface AnimationDuration {
  horizontalAnimation?: number;
  verticalAnimation?: number;
}
```

### `TotalAnimationDuration`

```ts
interface TotalAnimationDuration {
  animationDuration?: number;
  ratio?: number;
}
```

---

## License

MIT License © [Piotr Karwowski](https://github.com/piotrek96k)

---
