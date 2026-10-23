export type NavigationProgressEvent = "start" | "complete" | "failed";
export function navigationProgressReducer(isPending: boolean, event: NavigationProgressEvent): boolean;
