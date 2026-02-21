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
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
    // Ovdje ide Sentry.captureException(error) kad se doda monitoring
  }

  handleReset = () => {
    // Prvo pozivamo opcionalni callback iz propsa (npr. za čišćenje store-a)
    if (this.props.onReset) {
      this.props.onReset();
    }
    // Resetiramo lokalno stanje da pokušamo ponovno renderirati djecu
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in duration-500">
        {/* Icon container */}
        <div className="w-16 h-16 bg-error-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <AlertTriangle size={32} className="text-error-600" />
        </div>

        {/* Text content */}
        <h2 className="text-xl font-bold text-warm-900 mb-2">
          Ups! Nešto nije u redu
        </h2>
        <p className="text-warm-500 text-sm mb-8 max-w-sm leading-relaxed">
          {this.props.fallbackMessage ||
            this.props.message ||
            "Došlo je do neočekivane pogreške u aplikaciji. Pokušaj ponovno ili osvježi stranicu."}
        </p>

        {/* Action button */}
        <Button
          leftIcon={RefreshCw}
          onClick={this.handleReset}
          variant="primary"
        >
          Pokušaj ponovo
        </Button>
      </div>
    );
  }
}
