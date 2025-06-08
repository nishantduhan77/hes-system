declare module 'msw/node' {
  export function setupServer(...handlers: any[]): any;
}

declare module 'msw' {
  export function rest(...args: any[]): any;
  export function graphql(...args: any[]): any;
} 