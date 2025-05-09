import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';

// Page components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/jobs/JobList';
import JobDetail from './pages/jobs/JobDetail';
import CreateJob from './pages/employer/CreateJob';
import Profile from './pages/Profile';
import ResumeUpload from './pages/jobseeker/ResumeUpload';

// Dashboard components
import JobSeekerDashboard from './components/dashboard/JobSeekerDashboard';
import EmployerDashboard from './components/dashboard/EmployerDashboard';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/jobs" element={<JobList />} />
              <Route path="/jobs/:jobId" element={<JobDetail />} />

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <JobSeekerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/employer/dashboard"
                element={
                  <PrivateRoute roles={['employer']}>
                    <EmployerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/employer/jobs/create"
                element={
                  <PrivateRoute roles={['employer']}>
                    <CreateJob />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/resume/upload"
                element={
                  <PrivateRoute roles={['jobseeker']}>
                    <ResumeUpload />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App; 