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
  - [initialValue](#initial-value)
  - [value](#value)
  - [precision](#precision)
  - [digitGroupSeparator](#digit-group-separator)
  - [decimalSeparator](#decimal-separator)
  - [negativeCharacter](#negative-character)
  - [negativeCharacterAnimationMode](#negative-character-animation-mode)
  - [animationDuration](#animation-duration)
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

**numbers-transition** is a TypeScript/React library that provides **NumbersTransition** component for smooth transition
animations between numbers.

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

The trigger for the transition is [value](#value) prop change. The minimal configuration for component to work is:

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

|                                     Prop                                      | Type                                                                                                                                        | Default                                                                                                                                           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| :---------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                    <a id="initial-value"/>**initialValue**                    | \|&nbsp;[UncheckedBigDecimal](#unchecked-big-decimal)<br/>\|&nbsp;[BigDecimal](#big-decimal)<br/>\|&nbsp;undefined                          | 0                                                                                                                                                 | Initial value of [value](#value) prop to trigger transition on first render. If [initialValue](#initial-value) matches [value](#value) no initial animation is displayed.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
|                           <a id="value"/>**value**                            | \|&nbsp;[UncheckedBigDecimal](#unchecked-big-decimal)<br/>\|&nbsp;[BigDecimal](#big-decimal)<br/>\|&nbsp;undefined                          | 0                                                                                                                                                 | Value to display, its change is a trigger to start transition between previous and new value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|                       <a id="precision"/>**precision**                        | number&nbsp;\|&nbsp;undefined                                                                                                               | 0                                                                                                                                                 | Precision of the number to display, If precision is greater than zero then equals number of digits after decimal point. For negative values equals number of decimal places.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|            <a id="digit-group-separator"/>**digitGroupSeparator**             | \|&nbsp;[DigitGroupSeparatorCharacter](#digit-group-separator-character)<br/>\|&nbsp;undefined                                              | [DigitGroupSeparatorCharacter](#digit-group-separator-character).Space                                                                            | Digit group separator character to display.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|                <a id="decimal-separator"/>**decimalSeparator**                | \|&nbsp;[DecimalSeparatorCharacter](#decimal-separator-character)<br/>\|&nbsp;undefined                                                     | \|&nbsp;[DecimalSeparatorCharacter](#decimal-separator-character).Dot<br/>\|&nbsp;[DecimalSeparatorCharacter](#decimal-separator-character).Comma | Decimal separator character to display.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|               <a id="negative-character"/>**negativeCharacter**               | \|&nbsp;[NegativeCharacter](#negative-character-type)<br/>\|&nbsp;undefined                                                                 | [NegativeCharacter](#negative-character-type).Minus                                                                                               | Negative character to display.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| <a id="negative-character-animation-mode"/>**negativeCharacterAnimationMode** | \|&nbsp;[NegativeCharacterAnimationMode](#negative-character-animation-mode-type)<br/>\|&nbsp;undefined                                     | [NegativeCharacterAnimationMode](#negative-character-animation-mode-type).Single                                                                  | Controls negative character animation. [NegativeCharacterAnimationMode](#negative-character-animation-mode-type).Single displays only one negative character that moves with the rest of the animation. [NegativeCharacterAnimationMode](#negative-character-animation-mode-type).Multi displays multiple negative characters, each for moving digit on the right.                                                                                                                                                                                                                                                      |
|               <a id="animation-duration"/>**animationDuration**               | \|&nbsp;[AnimationDuration](#animation-duration-type)<br/>\|&nbsp;[TotalAnimationDuration](#total-animation-duration)<br/>\|&nbsp;undefined | {<br/>&nbsp;&nbsp;&nbsp;&nbsp;horizontalAnimation:&nbsp;2000,<br/>&nbsp;&nbsp;&nbsp;&nbsp;verticalAnimation:&nbsp;5000<br/>}                      | Animation duration time in milliseconds. When passed object is of type [AnimationDuration](#animation-duration-type) sets horizontal and vertical animation durations (if duration is zero, then no animation is played). When passed object is of type [TotalAnimationDuration](#total-animation-duration) sets total animation duration (duration of all animations either one, two or three) and ratio, which is a ratio of vertical animation duration to horizontal animation duration (when ratio is zero, then no vertical animation is played, when ratio is infinity, then no horizontal animation is played). |

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
