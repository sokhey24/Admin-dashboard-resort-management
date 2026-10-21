import { Component } from "react";
import { Button } from "antd";

/**
 * Catches render errors in lazy-loaded route trees. Does not handle failed API requests.
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
    console.error("Route render error:", error, info);
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
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            This page could not be displayed
          </h1>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            {error.message || "An unexpected error occurred while loading this screen."}
          </p>
          <Button type="primary" onClick={this.handleRetry}>
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
