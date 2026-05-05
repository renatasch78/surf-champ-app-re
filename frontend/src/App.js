import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Container, Typography, Button } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import UploadVideo from './pages/UploadVideo';
import Surfers from './pages/Surfers';
import Profile from './pages/Profile';

// Componente de rota autenticada
const AuthenticatedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

// Componente de rota de visitante
const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }
  
  return children;
};

// Componente de layout principal
const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#f5f5f5' }}>
        {children}
      </main>
    </>
  );
};

// Componente de tratamento de erros
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const errorHandler = (error) => {
      console.error('Erro capturado pelo ErrorBoundary:', error);
      setHasError(true);
      setError(error.toString());
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          Ocorreu um erro inesperado
        </Typography>
        <Typography variant="body1" paragraph>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Recarregar a página
        </Button>
      </Container>
    );
  }

  return children;
};

// Componente principal da aplicação
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* Router removed - already provided in index.js */}
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={
              <GuestRoute>
                <Layout>
                  <Login />
                </Layout>
              </GuestRoute>
            } />
            
            <Route path="/register" element={
              <GuestRoute>
                <Layout>
                  <Register />
                </Layout>
              </GuestRoute>
            } />
            
            {/* Rotas autenticadas */}
            <Route path="/" element={
              <AuthenticatedRoute>
                <Layout>
                  <UploadVideo />
                </Layout>
              </AuthenticatedRoute>
            } />
            
            <Route path="/dashboard" element={
              <AuthenticatedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </AuthenticatedRoute>
            } />
            
            <Route path="/surfers" element={
              <AuthenticatedRoute>
                <Layout>
                  <Surfers />
                </Layout>
              </AuthenticatedRoute>
            } />

            <Route path="/profile" element={
              <AuthenticatedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </AuthenticatedRoute>
            } />
            
            {/* Rota 404 */}
            <Route path="*" element={
              <Layout>
                <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="h4">Página não encontrada</Typography>
                  <Button variant="contained" onClick={() => window.history.back()} sx={{ mt: 2 }}>
                    Voltar
                  </Button>
                </Container>
              </Layout>
            } />
          </Routes>
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        {/* Router closing tag removed */}
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
