export interface ApiListResponse<T> {
  items: T[]
}

export interface ApiProblem {
  statusCode: number
  message: string
  error?: string
}
