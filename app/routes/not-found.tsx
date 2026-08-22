import { data } from 'react-router';

// Catch-all: any URL that doesn't match a real route gets a proper 404
// response, rendered by the root ErrorBoundary.
export function loader() {
  throw data(null, { status: 404 });
}

export default function NotFound() {
  return null;
}
