import type { Result } from "../domain/Result";

type NamedResult<T> ={
  source:String,
  result: Result<T>
}

export async function namedCall<T>(
  source: string,
  promise: Promise<Result<T>>
): Promise<NamedResult<T>> {
  const result = await promise;
  return { source, result };
}
