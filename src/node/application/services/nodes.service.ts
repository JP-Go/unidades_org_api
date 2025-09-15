import { Injectable } from '@nestjs/common';
import { Node, NodeId } from '../../domain/entities/node';
import { NodeRepository } from 'src/node/domain/repositories/node.repository';

@Injectable()
export abstract class NodeService {
  abstract getDescendants(
    nodeId: NodeId,
    minDepth?: number,
    maxDepth?: number,
  ): Promise<Node[]>;
  abstract getAncestors(
    node: NodeId,
    minDepth?: number,
    maxDepth?: number,
  ): Promise<Node[]>;
}

@Injectable()
export class NodeServiceImpl implements NodeService {
  constructor(private readonly nodeRepository: NodeRepository) {}
  async getDescendants(
    nodeId: NodeId,
    minDepth?: number,
    maxDepth?: number,
  ): Promise<Node[]> {
    const node = await this.nodeRepository.getNodeById(nodeId);
    return this.nodeRepository.getDescendants(node, minDepth, maxDepth);
  }
  async getAncestors(
    nodeId: NodeId,
    minDepth?: number,
    maxDepth?: number,
  ): Promise<Node[]> {
    const node = await this.nodeRepository.getNodeById(nodeId);
    return this.nodeRepository.getAncestors(node, minDepth, maxDepth);
  }
}
