import { Component } from 'react';
import { Button } from '../ui/Button.jsx';

/**
 * Catches render errors in lazy-loaded routes. API failures still use normal request handling.
 */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Route render error:', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-lg font-serif font-semibold text-text">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted">
            {error.message || 'This page could not be loaded. Please try again.'}
          </p>
          <Button type="button" variant="primary" onClick={this.handleRetry}>
            Reload page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
