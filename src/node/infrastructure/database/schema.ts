import { node, edges } from './node.model';

export const schema = {
  node,
  edges,
};

export default schema;

export type Schema = typeof schema;
