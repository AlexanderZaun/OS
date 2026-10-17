import type {Value} from './project';

/** Creation values only. Saved objects never refer back to a template. */
export interface ObjectTemplate {
  id:string;
  effect:string;
  label:{ru:string;en:string};
  values:Record<string,Value>;
}
