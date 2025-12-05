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
  - [animationTimingFunction](#animationtimingfunction)
  - [animationInterruptionMode](#animationinterruptionmode)
- [Constants](#constants)
  - [AnimationTimingFunction](#animationtimingfunction-1)
- [Types](#types)
  - [UncheckedBigDecimal](#uncheckedbigdecimal)
  - [BigDecimal](#bigdecimal)
  - [DigitGroupSeparatorCharacter](#digitgroupseparatorcharacter)
  - [DecimalSeparatorCharacter](#decimalseparatorcharacter)
  - [NegativeCharacter](#negativecharacter-1)
  - [NegativeCharacterAnimationMode](#negativecharacteranimationmode-1)
  - [AnimationDuration](#animationduration-1)
  - [TotalAnimationDuration](#totalanimationduration)
  - [ReadOnly<T>](#readonlyt)
  - [OrReadOnly<T>](#orreadonlyt)
  - [StepPosition](#stepposition)
  - [LinearEasingFunction](#lineareasingfunction)
  - [CubicBezierEasingFunction](#cubicbeziereasingfunction)
  - [StepsEasingFunction](#stepseasingfunction)
  - [EasingFunction](#easingfunction)
  - [ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)
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
- **Description:** Initial value of the <code>[value](#value)</code> prop used to trigger a transition on first render. If <code>[initialValue](#initialvalue)</code> matches <code>[value](#value)</code>, no initial animation is displayed.

### `value`

- **Type**: <code>[UncheckedBigDecimal](#uncheckedbigdecimal) | [BigDecimal](#bigdecimal) | undefined</code>
- **Default:** `0`
- **Description:** The value to display. When it changes, the component animates the transition from the previous value to the new one.

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

### `animationTimingFunction`

- **Type:** <code>[OrReadOnly](#orreadonlyt)<[EasingFunction](#easingfunction)> | [ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)</code>
- **Default:** <code>[AnimationTimingFunction](#animationtimingfunction-1).Ease</code>
- **Description:** Controls the easing curve used for the number transition animation. This prop accepts either:
  - A single easing function of <code>[EasingFunction](#easingfunction)</code> type, which is applied to horizontal/vertical animations.
  - Separate easing functions per axis using <code>[ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)</code>

### `animationInterruptionMode`

- **Type:** <code>[AnimationInterruptionMode](#animationinterruptionmode-1) | undefined</code>
- **Default:** <code>[AnimationInterruptionMode](#animationinterruptionmode-1).Interrupt</code>
- **Description:** Controls how the component behaves when the value changes while an animation is still in progress. There are two modes:
  - <code>[AnimationInterruptionMode](#animationinterruptionmode-1).Interrupt</code> Immediately stops the current animation, forces it to finish, and starts a new one from the final state. This makes transitions more responsive when values update rapidly.
  - <code>[AnimationInterruptionMode](#animationinterruptionmode-1).Continue</code> Lets the current animation(s) finish before starting the next update. If multiple value changes occur during this time, they are queued. This preserves smooth, sequential transitions at the cost of responsiveness.

---

## Constants

### `AnimationTimingFunction`

- ```ts
  const AnimationTimingFunction = {
    Linear: [0, 1],
    Ease: [
      [0.25, 0.1],
      [0.25, 1],
    ],
    EaseIn: [
      [0.42, 0],
      [1, 1],
    ],
    EaseOut: [
      [0, 0],
      [0.58, 1],
    ],
    EaseInOut: [
      [0.42, 0],
      [0.58, 1],
    ],
    StepStart: { steps: 1, stepPosition: StepPosition.JumpStart },
    StepEnd: { steps: 1, stepPosition: StepPosition.JumpEnd },
  } as const;
  ```
- **Description:** <code>[AnimationTimingFunction](#animationtimingfunction-1)</code> is a predefined collection of standard CSS easing presets:
  - `Linear` – Equivalent to CSS `linear`.
  - `Ease` – Equivalent to CSS `ease`.
  - `EaseIn` – Equivalent to CSS `ease-in`.
  - `EaseOut` – Equivalent to `ease-out`.
  - `EaseInOut` – Equivalent to `ease-in-out`.
  - `StepStart` – Equivalent to CSS `step-start`.
  - `StepEnd` – Equivalent to CSS `step-end`.
- **See also:** <code>[animationTimingFunction](#animationtimingfunction)</code> <code>[LinearEasingFunction](#lineareasingfunction)</code> <code>[CubicBezierEasingFunction](#cubicbeziereasingfunction)</code> <code>[StepsEasingFunction](#stepseasingfunction)</code> <code>[EasingFunction](#easingfunction)</code> <code>[ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)</code>

## Types

### `UncheckedBigDecimal`

- ```ts
  type UncheckedBigDecimal = number | bigint | string;
  ```
- **Description:** Primitive numeric input accepted by the component without validation.
- **See also:** <code>[initialValue](#initialvalue)</code> <code>[value](#value)</code> <code>[BigDecimal](#bigdecimal)</code>

### `BigDecimal`

- ```ts
  type BigDecimal = number | bigint | `${number}`;
  ```
- **Description:** A strictly validated numeric type.
- **See also:** <code>[initialValue](#initialvalue)</code> <code>[value](#value)</code> <code>[UncheckedBigDecimal](#uncheckedbigdecimal)</code>

### `DigitGroupSeparatorCharacter`

- ```ts
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
- **Description:** Enum of allowed digit-group separators for formatting large numbers. Controls how thousands/millions/etc. are visually separated.
- **See also:** <code>[digitGroupSeparator](#digitgroupseparator)</code> <code>[decimalSeparator](#decimalseparator)</code> <code>[DecimalSeparatorCharacter](#decimalseparatorcharacter)</code>

### `DecimalSeparatorCharacter`

- ```ts
  enum DecimalSeparatorCharacter {
    Comma = ',', // \u002C
    Dot = '.', // \u002E
  }
  ```
- **Description:** Enum of characters that can be used as the decimal separator.
- **See also:** <code>[decimalSeparator](#decimalseparator)</code> <code>[digitGroupSeparator](#digitgroupseparator)</code> <code>[DigitGroupSeparatorCharacter](#digitgroupseparatorcharacter)</code>

### `NegativeCharacter`

- ```ts
  enum NegativeCharacter {
    Hyphen = '-', // \u002D
    HyphenMinus = '﹣', // \uFE63
    Minus = '−', // \u2212
    Dash = '–', // \u2013
  }
  ```
- **Description:** Enum of available glyphs for representing negative numbers. Allows using stylistically different minus/hyphen characters.
- **See also:** <code>[negativeCharacter](#negativecharacter)</code> <code>[negativeCharacterAnimationMode](#negativecharacteranimationmode)</code> <code>[NegativeCharacterAnimationMode](#negativecharacteranimationmode-1)</code>

### `NegativeCharacterAnimationMode`

- ```ts
  enum NegativeCharacterAnimationMode {
    Single = 'single',
    Multi = 'multi',
  }
  ```
- **Description:** Controls whether the negative symbol is animated once (`Single`) or duplicated per digit (`Multi`).
- **See also:** <code>[negativeCharacterAnimationMode](#negativecharacteranimationmode)</code> <code>[negativeCharacter](#negativecharacter)</code> <code>[NegativeCharacter](#negativecharacter-1)</code>

### `AnimationDuration`

- ```ts
  interface AnimationDuration {
    horizontalAnimation?: number;
    verticalAnimation?: number;
  }
  ```
- **Description:** Configures per-axis animation duration. If a value is `0`, that axis animation is skipped.
- **See also:** <code>[animationDuration](#animationduration)</code> <code>[TotalAnimationDuration](#totalanimationduration)</code>

### `TotalAnimationDuration`

- ```ts
  interface TotalAnimationDuration {
    animationDuration?: number;
    ratio?: number;
  }
  ```
- **Description:** Alternative duration configuration defining:
  - total animation time
  - vertical-to-horizontal duration ratio

  This allows proportional timing without specifying each axis directly.

- **See also:** <code>[animationDuration](#animationduration)</code> <code>[AnimationDuration](#animationduration-1)</code>

### `ReadOnly<T>`

- ```ts
  type ReadOnly<T> = { +readonly [K in keyof T]: ReadOnly<T[K]> };
  ```
- **Description:** Utility type that recursively sets all properties of `T` as readonly.
- **See also:** <code>[OrReadOnly<T>](#orreadonlyt)</code>

### `OrReadOnly<T>`

- ```ts
  type OrReadOnly<T> = T | ReadOnly<T>;
  ```
- **Description:** Utility type which represents either a mutable or a deeply readonly version of type T.
- **See also:** <code>[ReadOnly<T>](#readonlyt)</code>

### `StepPosition`

- ```ts
  export enum StepPosition {
    JumpStart = 'jump-start',
    JumpEnd = 'jump-end',
    JumpNone = 'jump-none',
    JumpBoth = 'jump-both',
  }
  ```
- **Description:** Represents the `step-position` argument of the CSS `steps()` easing function.
- **See also:** <code>[StepsEasingFunction](#stepseasingfunction)</code>

### `LinearEasingFunction`

- ```ts
  type LinearEasingFunction = [number, ...(number | [number, number] | [number, number, number])[], number];
  ```
- **Description:** Represents the CSS `linear()` easing function with one or more interpolation stops:
  - The first and last elements are numbers — these correspond to the starting and ending output values of the easing curve (0–1 range in CSS).
  - Each inner element represents a stop. It can be:
    - `number` → Value-only stop (implies evenly spaced position).
    - `[number, number]` → `[value, percentage]`
    - `[number, number, number]` → `[value, percentage, percentage]`
  - **See also:** <code>[animationTimingFunction](#animationtimingfunction)</code> <code>[CubicBezierEasingFunction](#cubicbeziereasingfunction)</code> <code>[StepsEasingFunction](#stepseasingfunction)</code> <code>[EasingFunction](#easingfunction)</code> <code>[ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)</code>

### `CubicBezierEasingFunction`

- ```ts
  type CubicBezierEasingFunction = [[number, number], [number, number]];
  ```
- **Description:** Represents the CSS `cubic-bezier(x1, y1, x2, y2)` easing function. The cubic Bézier function has four control points, but CSS exposes only the two inner points. Those are split into two tuples:
  - First tuple → Control point 1: `[x1, y1]`
  - Second tuple → Control point 2: `[x2, y2]`
- **See also:** <code>[animationTimingFunction](#animationtimingfunction)</code> <code>[LinearEasingFunction](#lineareasingfunction)</code> <code>[StepsEasingFunction](#stepseasingfunction)</code> <code>[EasingFunction](#easingfunction)</code> <code>[ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)</code>

### `StepsEasingFunction`

- ```ts
  interface StepsEasingFunction {
    steps: number;
    stepPosition: StepPosition;
  }
  ```
- **Description:** Represents the CSS `steps()` easing function.
  - `steps`: The number of discrete steps (must be ≥ 1 in CSS).
  - `stepPosition`: Controls when within each step the output jumps, using the <code>[StepPosition](#stepposition)</code> enum.
- **See also:** <code>[animationTimingFunction](#animationtimingfunction)</code> <code>[StepPosition](#stepposition)</code> <code>[LinearEasingFunction](#lineareasingfunction)</code> <code>[CubicBezierEasingFunction](#cubicbeziereasingfunction)</code> <code>[EasingFunction](#easingfunction)</code> <code>[ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)</code>

### `EasingFunction`

- ```ts
  type EasingFunction = LinearEasingFunction | CubicBezierEasingFunction | StepsEasingFunction;
  ```
- **Description:** A union representing any supported CSS easing function:
  - <code>[LinearEasingFunction](#lineareasingfunction)</code> → `linear()`
  - <code>[CubicBezierEasingFunction](#cubicbeziereasingfunction)</code> → `cubic-bezier()`
  - <code>[StepsEasingFunction](#stepseasingfunction)</code> → `steps()`
- **See also:** <code>[animationTimingFunction](#animationtimingfunction)</code> <code>[ReadOnly<T>](#readonlyt)</code> <code>[OrReadOnly<T>](#orreadonlyt)</code> <code>[LinearEasingFunction](#lineareasingfunction)</code> <code>[CubicBezierEasingFunction](#cubicbeziereasingfunction)</code> <code>[StepsEasingFunction](#stepseasingfunction)</code> <code>[ExtendedAnimationTimingFunction](#extendedanimationtimingfunction)</code>

### `ExtendedAnimationTimingFunction`

- ```ts
  export interface ExtendedAnimationTimingFunction {
    horizontalAnimation: OrReadOnly<EasingFunction>;
    verticalAnimation: OrReadOnly<EasingFunction>;
  }
  ```
- **Description:** Specifies separate easing functions for horizontal and vertical animations. Each accepts both mutable and readonly versions of <code>[EasingFunction](#easingfunction)</code>.
- **See also:** <code>[animationTimingFunction](#animationtimingfunction)</code> <code>[ReadOnly<T>](#readonlyt)</code> <code>[OrReadOnly<T>](#orreadonlyt)</code> <code>[LinearEasingFunction](#lineareasingfunction)</code> <code>[CubicBezierEasingFunction](#cubicbeziereasingfunction)</code> <code>[StepsEasingFunction](#stepseasingfunction)</code> <code>[EasingFunction](#easingfunction)</code>

### `AnimationInterruptionMode`

- ```ts
  enum AnimationInterruptionMode {
    Interrupt = 'interrupt',
    Continue = 'continue',
  }
  ```
- **Description:** Defines how the component handles new updates while an animation is still running.
- **See also:** <code>[animationInterruptionMode](#animationinterruptionmode)</code>

---

## License

MIT License © [Piotr Karwowski](https://github.com/piotrek96k)

---
