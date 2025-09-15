import { getTableColumns } from 'drizzle-orm';
import { node } from '../node.model';

const nodeColumns = getTableColumns(node);
export type NodeColumns = typeof nodeColumns;
