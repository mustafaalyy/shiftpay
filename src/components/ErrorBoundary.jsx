import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = "";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
              !
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">عفواً، حدث خطأ غير متوقع</h2>
              <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                واجه النظام مشكلة أثناء معالجة الصفحة. تم تسجيل الخطأ لمنع تكراره.
              </p>
            </div>
            {this.state.error?.message ? (
              <div className="text-xs bg-slate-100 p-3 rounded-lg text-slate-700 font-mono text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            ) : null}
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition"
              >
                إعادة تحميل الصفحة
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition"
              >
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
