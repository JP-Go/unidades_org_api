import { Node } from '../entities/node';

export abstract class NodeRepository {
  abstract getDescendants(node: Node): Promise<Node>;
  abstract getAncestors(node: Node): Promise<Node>;
}
