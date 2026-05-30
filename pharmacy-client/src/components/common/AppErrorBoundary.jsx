import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('AppErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <h1>Сталася помилка на сторінці</h1>
          <div className="alert alert-error">Спробуйте оновити сторінку. Якщо проблема повторюється, перейдіть в інший розділ.</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Оновити сторінку</button>
        </div>
      );
    }
    return this.props.children;
  }
}
