// components/common/ErrorBoundary.jsx
import { Component } from "react";
import { Button } from "@/components/common/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    // Ovdje ide Sentry.captureException(error) kad se doda monitoring
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
        <div className="w-16 h-16 bg-error-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={28} className="text-error-600" />
        </div>
        <h2 className="text-lg font-bold text-warm-900 mb-2">
          Došlo je do greške
        </h2>
        <p className="text-warm-500 text-sm mb-6 max-w-sm">
          {this.props.fallbackMessage ||
            "Nešto nije prošlo kako treba. Pokušaj ponovo."}
        </p>
        <Button
          leftIcon={RefreshCw}
          onClick={() => {
            this.setState({ hasError: false, error: null });
            this.props.onReset?.();
          }}
        >
          Pokušaj ponovo
        </Button>
      </div>
    );
  }
}
