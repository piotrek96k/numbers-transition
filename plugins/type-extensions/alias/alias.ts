import { createHash } from 'crypto';
import { Node } from 'typescript';
import { Encoding } from '../enums/encoding';
import { HashAlgorithm } from '../enums/hash-algorithm';

export const generateAlias = (name: string, node: Node | string): string =>
  `${name}${createHash(HashAlgorithm.Sha256)
    .update(typeof node === 'string' ? `${node}${name}` : `${node.pos}${name}${node.end}`)
    .digest(Encoding.Hex)}`;
