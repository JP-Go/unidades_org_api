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
  id: NodeId;
  type: NodeType;
  name: string;
  depth: number;
  ancestor?: Node;
  descendants?: Node[];

  constructor(
    { type, depth, name }: NodeConstructorParams,
    id: NodeId | null = null,
  ) {
    this.id = id ?? 0;
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

  static create(email: string, name: string) {
    return new User({
      email,
      name,
      type: 'user',
      depth: 0,
    });
  }
  static existing(email: string, name: string, depth: number, id: number) {
    return new User(
      {
        email,
        name,
        depth,
        type: 'user',
      },
      id,
    );
  }
}
export class Group extends Node {
  constructor(
    params: DefinedTypeConstructorParams<'group'>,
    id: NodeId | null = null,
  ) {
    super({ ...params, type: 'group' }, id);
  }
  static create(name: string) {
    return new Group({
      name,
      type: 'group',
      depth: 0,
    });
  }
  static existing(name: string, depth: number, id: number) {
    return new Group(
      {
        name,
        depth,
        type: 'group',
      },
      id,
    );
  }
}
