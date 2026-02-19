export class Test {}

export class MyArray<T> extends Array<T> {
  public readonly value = 'wtf';
}

export class MyString extends String {}

export class A {
  get foo() {
    return 'A';
  }
}

export class B extends A {
  //   get foo() {
  //     return 'B';
  //   }
}

export class C extends B {
  get foo() {
    return 'C';
  }
}
