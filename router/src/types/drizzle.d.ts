declare module 'drizzle-orm/pg-core' {
  export function pgTable(name: string, columns: Record<string, unknown>): unknown;
  export function serial(name?: string): any;
  export function text(name?: string): any;
  export function real(name?: string): any;
  export function integer(name?: string): any;
  export function timestamp(name?: string): any;
  export function boolean(name?: string): any;
}
