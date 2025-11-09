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
  - [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [Peer Dependencies](#peer-dependencies)

---

## Introduction

**numbers-transition** ia a TypeScript/React library that provides **NumbersTransition** component for smooth transitions between numbers.

---

## Getting Started

### Prerequisites

- Node.js ≥ 16.x
- npm or yarn/pnpm
- React 18+
- styled-components 6

### Installation

```bash
npm install numbers-transition
# or
yarn add numbers-transition
```

---

## Usage

The trigger for the transition is `value` prop change. The minimal configuration for component to work is:

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

---

## Peer Dependencies

- react
- react-dom
- styled-components
