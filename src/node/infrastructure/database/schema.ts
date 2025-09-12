import { node, nodesClosure } from './node.model';

export const schema = {
  node,
  nodesClosure,
};

export default schema;

export type Schema = typeof schema;
