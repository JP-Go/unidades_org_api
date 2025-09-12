import { node, nodesClosure } from './node.model';

export const schema = {
  node,
  nodesClosure,
};

export type Schema = typeof schema;
