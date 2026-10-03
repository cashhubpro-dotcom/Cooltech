// src/shared/AutoRefresh.jsx
// Wrap the <Routes> of a panel:
//
//   <AutoRefresh>
//     <Routes> … </Routes>
//   </AutoRefresh>
//
// After any successful add / edit / delete anywhere in the app, the page that is
// currently open is re-mounted, so it re-fetches its data — no manual reload.
// Renders no extra DOM element, so layout and styling are untouched.
//
// Trade-off: page-local UI state (search box, filters, active tab, page number)
// resets when the refresh happens. State kept in App.jsx and in modals survives.
import { Fragment } from 'react';
import { installFetchSync, useDataVersion } from './dataSync';

installFetchSync();   // idempotent — safe to be imported by all three panels

export default function AutoRefresh({ children }) {
  const version = useDataVersion();
  return <Fragment key={version}>{children}</Fragment>;
}