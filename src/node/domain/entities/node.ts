export type NodeId = number;
export const NodeType = {
  user: 'user',
  group: 'group',
} as const;

type NodeConstructorParams = {
  name: string;
  depth: number;
  type: NodeType;
};

export type NodeType = keyof typeof NodeType;
export class Node {
  id: NodeId | null;
  type: NodeType;
  name: string;
  depth: number;
  ancestor?: Node;
  descendants: Node[];

  constructor(
    { type, depth, name }: NodeConstructorParams,
    id: NodeId | null = null,
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.depth = depth;
  }
}

type DefinedTypeConstructorParams<T extends NodeType> = Omit<
  NodeConstructorParams,
  'type'
> & { type: T };

export class User extends Node {
  email: string;

  constructor(
    {
      email,
      ...params
    }: DefinedTypeConstructorParams<'user'> & { email: string },
    id: NodeId | null = null,
  ) {
    super({ ...params, type: 'user' }, id);
    this.email = email;
  }

  static create(email: string, name: string, depth: number) {
    return new User({
      depth,
      email,
      name,
      type: 'user',
    });
  }
}
export class Group extends Node {
  constructor(
    params: DefinedTypeConstructorParams<'group'>,
    id: NodeId | null = null,
  ) {
    super({ ...params, type: 'group' }, id);
  }
}
