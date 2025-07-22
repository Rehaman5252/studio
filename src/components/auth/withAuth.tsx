
'use client';

// This component is no longer used and can be safely removed.
// Authentication is now handled within the components that need it,
// or on the server for page-level protection.

import React from 'react';

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> => {
  const WithAuthComponent: React.FC<P> = (props) => {
    // This logic is now handled directly in the page or layout
    // that needs authentication, making the flow clearer and more performant.
    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
