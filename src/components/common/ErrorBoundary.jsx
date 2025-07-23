import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught An Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Save error details to state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you would log this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // This is where you would integrate with error reporting services
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous',
      errorId: this.state.errorId
    };

    // Example: Send to error reporting service
    // Sentry.captureException(error, { extra: errorData });
    
    // For now, just log to console in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Error logged:', errorData);
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-red-900/20 to-black">
          <Card className="w-full max-w-md glass-effect border-red-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-xl font-bold text-white">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-300">
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-red-900/30 p-3 border border-red-500/30">
                  <div className="text-sm text-red-200 font-mono">
                    <div className="font-bold mb-2">Error Details:</div>
                    <div className="mb-2">{this.state.error.message}</div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-red-300 hover:text-red-200">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs whitespace-pre-wrap text-red-200">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {this.state.errorId && (
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Error ID: <span className="font-mono">{this.state.errorId}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please include this ID when reporting the issue.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper for functional components
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for manual error reporting
export const useErrorHandler = () => {
  const reportError = (error, errorInfo = {}) => {
    // Manual error reporting
    const errorData = {
      message: error.message || 'Manual error report',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...errorInfo
    };

    console.error('Manual error report:', errorData);
    
    // In production, send to error reporting service
    // Sentry.captureException(error, { extra: errorData });
  };

  return { reportError };
};

export default ErrorBoundary;