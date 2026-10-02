import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthPage from '@/pages/AuthPage';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ClientsPage from '@/pages/ClientsPage';
import PropertiesPage from '@/pages/PropertiesPage';
import AppointmentsPage from '@/pages/AppointmentsPage';
import SellersPage from '@/pages/SellersPage';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="flex items-center gap-2 text-[#86868b]">
          <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
          <span className="text-[15px]">Caricamento...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Layout currentPage={page} onPageChange={setPage}>
      {page === 'dashboard' && <Dashboard onPageChange={setPage} />}
      {page === 'clients' && <ClientsPage />}
      {page === 'sellers' && <SellersPage />}
      {page === 'properties' && <PropertiesPage />}
      {page === 'appointments' && <AppointmentsPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
