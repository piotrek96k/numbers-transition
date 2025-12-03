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
  - [UncheckedBigDecimal](#unchecked-big-decimal)
  - [BigDecimal](#big-decimal)
  - [DigitGroupSeparatorCharacter](#digit-group-separator-character)
  - [DecimalSeparatorCharacter](#decimal-separator-character)
  - [NegativeCharacter](#negative-character-type)
  - [NegativeCharacterAnimationMode](#negative-character-animation-mode-type)
  - [AnimationDuration](#animation-duration-type)
  - [TotalAnimationDuration](#total-animation-duration)
- [License](#license)

---

## Introduction

**numbers-transition** is a TypeScript/React library that provides the **NumbersTransition** component for smooth transition animations between numbers.

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

```bash
npm install numbers-transition
# or
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

- **Type:** <code>[UncheckedBigDecimal](#unchecked-big-decimal) | [BigDecimal](#big-decimal) | undefined</code>
- **Default:** `0`
- **Description:** Initial value of <code>[value](#value)</code> prop to trigger transition on first render. If <code>[initialValue](#initialvalue)</code> matches <code>[value](#value)</code>, no initial animation is displayed.

### `value`

- **Type**: <code>[UncheckedBigDecimal](#unchecked-big-decimal) | [BigDecimal](#big-decimal) | undefined</code>
- **Default:** `0`
- **Description:** The value to display. Its change triggers the transition between the previous and new value.

### `precision`

- **Type:** `number | undefined`
- **Default:** `0`
- **Description:** Precision of the displayed number.
  - If precision is greater than zero, it represents the number of digits after the decimal point.
  - If precision is negative, it represents the number of decimal places to round to.

### `digitGroupSeparator`

- **Type:** <code>[DigitGroupSeparatorCharacter](#digit-group-separator-character) | undefined</code>
- **Default:** <code>[DigitGroupSeparatorCharacter](#digit-group-separator-character).Space</code>
- **Description:** The digit group separator character to display.

### `decimalSeparator`

- **Type:** <code>[DecimalSeparatorCharacter](#decimal-separator-character) | undefined</code>
- **Default:** The default <code>[decimalSeparator](#decimalseparator)</code> is determined based on <code>[digitGroupSeparator](#digitgroupseparator)</code>.
  - If <code>[digitGroupSeparator](#digitgroupseparator)</code> is <code>[DigitGroupSeparatorCharacter](#digit-group-separator-character).Comma</code>, then the <code>[decimalSeparator](#decimalseparator)</code> defaults to <code>[DecimalSeparatorCharacter](#decimal-separator-character).Dot</code>.
  - Otherwise, it defaults to <code>[DecimalSeparatorCharacter](#decimal-separator-character).Comma</code>.
- **Description**: The decimal separator character to display.

### `negativeCharacter`

- **Type:** <code>[NegativeCharacter](#negative-character-type) | undefined</code>
- **Default:** <code>[NegativeCharacter](#negative-character-type).Minus</code>
- **Description:** Negative character to display.

### `negativeCharacterAnimationMode`

- **Type:** <code>[NegativeCharacterAnimationMode](#negative-character-animation-mode-type) | undefined</code>
- **Default:** <code>[NegativeCharacterAnimationMode](#negative-character-animation-mode-type).Single</code>
- **Description:** Controls how the negative character is animated.
  - <code>[NegativeCharacterAnimationMode](#negative-character-animation-mode-type).Single</code> displays one negative character that moves together with the rest of the animation.
  - <code>[NegativeCharacterAnimationMode](#negative-character-animation-mode-type).Multi</code> displays multiple negative characters — one for each moving digit on the right.

### `animationDuration`

- **Type:** <code>[AnimationDuration](#animation-duration-type) | [TotalAnimationDuration](#total-animation-duration) | undefined</code>
- **Default:** `{ horizontalAnimation: 2000, verticalAnimation: 5000 }`
- **Description:** Animation duration in milliseconds.
  - If the provided object is of type <code>[AnimationDuration](#animation-duration-type)</code>, it sets the horizontal and vertical animation durations (if a duration is zero, that animation is skipped).
  - If the provided object is of type <code>[TotalAnimationDuration](#total-animation-duration)</code>, it sets the total duration of all animations and a ratio, which is the ratio of vertical animation duration to horizontal animation duration (ratio = 0 disables vertical animation; ratio = ∞ disables horizontal animation).

---

## Types

|                                        Type                                        | Definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :--------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|               <a id="unchecked-big-decimal"/>**UncheckedBigDecimal**               | number&nbsp;\|&nbsp;bigint&nbsp;\|&nbsp;string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|                        <a id="big-decimal"/>**BigDecimal**                         | number&nbsp;\|&nbsp;bigint&nbsp;\|&nbsp;\`${number}\`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|     <a id="digit-group-separator-character"/>**DigitGroupSeparatorCharacter**      | enum&nbsp;DigitGroupSeparatorCharacter&nbsp;{<br/>&nbsp;&nbsp;&nbsp;&nbsp;None&nbsp;=&nbsp;'',<br/>&nbsp;&nbsp;&nbsp;&nbsp;Comma&nbsp;=&nbsp;',',&nbsp;//&nbsp;\u002C<br/>&nbsp;&nbsp;&nbsp;&nbsp;Dot&nbsp;=&nbsp;'.',&nbsp;//&nbsp;\u002E<br/>&nbsp;&nbsp;&nbsp;&nbsp;ThinSpace&nbsp;=&nbsp;' ',&nbsp;//&nbsp;\u2009<br/>&nbsp;&nbsp;&nbsp;&nbsp;Space&nbsp;=&nbsp;' ',&nbsp;//&nbsp;\u0020<br/>&nbsp;&nbsp;&nbsp;&nbsp;Underscore&nbsp;=&nbsp;'\_',&nbsp;//&nbsp;\u005F<br/>&nbsp;&nbsp;&nbsp;&nbsp;Apostrophe&nbsp;=&nbsp;"'",&nbsp;//&nbsp;\u0027<br/>} |
|         <a id="decimal-separator-character"/>**DecimalSeparatorCharacter**         | enum&nbsp;DecimalSeparatorCharacter&nbsp;{<br/>&nbsp;&nbsp;&nbsp;&nbsp;Comma&nbsp;=&nbsp;',',&nbsp;//&nbsp;\u002C<br/>&nbsp;&nbsp;&nbsp;&nbsp;Dot&nbsp;=&nbsp;'.',&nbsp;//&nbsp;\u002E<br/>}                                                                                                                                                                                                                                                                                                                                                                |
|               <a id="negative-character-type"/>**NegativeCharacter**               | enum&nbsp;NegativeCharacter&nbsp;{<br/>&nbsp;&nbsp;&nbsp;&nbsp;Hyphen&nbsp;=&nbsp;'-',&nbsp;//&nbsp;\u002D<br/>&nbsp;&nbsp;&nbsp;&nbsp;HyphenMinus&nbsp;=&nbsp;'﹣',&nbsp;//&nbsp;\uFE63<br/>&nbsp;&nbsp;&nbsp;&nbsp;Minus&nbsp;=&nbsp;'−',&nbsp;//&nbsp;\u2212<br/>&nbsp;&nbsp;&nbsp;&nbsp;Dash&nbsp;=&nbsp;'–',&nbsp;//&nbsp;\u2013<br/>}                                                                                                                                                                                                                 |
| <a id="negative-character-animation-mode-type"/>**NegativeCharacterAnimationMode** | enum&nbsp;NegativeCharacterAnimationMode&nbsp;{<br/>&nbsp;&nbsp;&nbsp;&nbsp;Single = 'single',<br/>&nbsp;&nbsp;&nbsp;&nbsp;Multi = 'multi',<br/>}                                                                                                                                                                                                                                                                                                                                                                                                           |
|               <a id="animation-duration-type"/>**AnimationDuration**               | interface&nbsp;AnimationDuration&nbsp;{<br/>&nbsp;&nbsp;&nbsp;&nbsp;horizontalAnimation?:&nbsp;number;<br/>&nbsp;&nbsp;&nbsp;&nbsp;verticalAnimation?:&nbsp;number;<br/>}                                                                                                                                                                                                                                                                                                                                                                                   |
|            <a id="total-animation-duration"/>**TotalAnimationDuration**            | interface&nbsp;TotalAnimationDuration&nbsp;{<br/>&nbsp;&nbsp;&nbsp;&nbsp;animationDuration?:&nbsp;number;<br/>&nbsp;&nbsp;&nbsp;&nbsp;ratio?:&nbsp;number;<br/>}                                                                                                                                                                                                                                                                                                                                                                                            |

---

## License

MIT License © [Piotr Karwowski](https://github.com/piotrek96k)

---
