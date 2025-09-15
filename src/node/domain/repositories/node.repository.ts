import { Node, type NodeId } from '../entities/node';

export abstract class NodeRepository {
  abstract getDescendants(
    node: Node,
    minDepth?: number,
    maxDepth?: number,
  ): Promise<Node[]>;
  abstract getAncestors(
    node: Node,
    minDepth?: number,
    maxDepth?: number,
  ): Promise<Node[]>;
  abstract addNode(node: Node): Promise<Node>;
  abstract addEdge(fromNode: Node, toNode: Node): Promise<void>;
  abstract getNodeById(id: NodeId): Promise<Node>;
}
