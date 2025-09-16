export type NodeId = string;
export const NodeType = {
  user: 'user',
  group: 'group',
} as const;

type NodeConstructorParams = {
  name: string;
  depth: number;
  email: string | null;
  type: NodeType;
};

export type NodeType = keyof typeof NodeType;
export class Node {
  id: NodeId;
  type: NodeType;
  name: string;
  email: string | null;
  depth: number;
  ancestor?: Node;
  descendants?: Node[];

  constructor(
    { type, depth, name, email }: NodeConstructorParams,
    id: NodeId | null = null,
  ) {
    this.id = id ?? crypto.randomUUID();
    this.type = type;
    this.name = name;
    this.email = email;
    this.depth = depth;
  }
}

type DefinedTypeConstructorParams<T extends NodeType> = Omit<
  NodeConstructorParams,
  'type'
> & { type: T };

export class User extends Node {
  constructor(
    params: DefinedTypeConstructorParams<'user'> & { email: string },
    id: NodeId | null = null,
  ) {
    super({ ...params, type: 'user' }, id);
  }

  static create(email: string, name: string) {
    return new User({
      email,
      name,
      type: 'user',
      depth: 0,
    });
  }
  static existing(email: string, name: string, depth: number, id: string) {
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
    params: DefinedTypeConstructorParams<'group'> & { email: null },
    id: NodeId | null = null,
  ) {
    super({ ...params, email: null, type: 'group' }, id);
  }
  static create(name: string) {
    return new Group({
      name,
      email: null,
      type: 'group',
      depth: 0,
    });
  }
  static existing(name: string, depth: number, id: string) {
    return new Group(
      {
        name,
        depth,
        email: null,
        type: 'group',
      },
      id,
    );
  }
}
