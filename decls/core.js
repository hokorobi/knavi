declare class Object {
  static entries<V>(object: { [k: string]: V }): Array<[string, V]>;
  static assign: Object$Assign;
}
