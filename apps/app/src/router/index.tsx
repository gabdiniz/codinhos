import { createBrowserRouter, Navigate } from 'react-router-dom'
import { TenantLayout } from './TenantLayout.tsx'
import { ProtectedRoute } from './ProtectedRoute.tsx'
import { StudentShell } from './StudentShell.tsx'
import { ManagerShell } from './ManagerShell.tsx'
import { AdminShell } from './AdminShell.tsx'

// Pages -- lazy imports para code splitting
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('../pages/LoginPage.tsx'))

// Student
const StudentDashboardPage = lazy(() => import('../pages/student/DashboardPage.tsx'))
const LearnPage = lazy(() => import('../pages/student/LearnPage.tsx'))
const ChallengePage = lazy(() => import('../pages/student/ChallengePage.tsx'))
const ProfilePage = lazy(() => import('../pages/student/ProfilePage.tsx'))
const RankingPage = lazy(() => import('../pages/student/RankingPage.tsx'))

// Manager
const ManagerDashboardPage = lazy(() => import('../pages/manager/DashboardPage.tsx'))
const ClassesPage = lazy(() => import('../pages/manager/ClassesPage.tsx'))
const StudentsPage = lazy(() => import('../pages/manager/StudentsPage.tsx'))
const SettingsPage = lazy(() => import('../pages/manager/SettingsPage.tsx'))

// Admin
const TenantsPage = lazy(() => import('../pages/admin/TenantsPage.tsx'))
const BadgesPage = lazy(() => import('../pages/admin/BadgesPage.tsx'))
const AdminUsersPage = lazy(() => import('../pages/admin/UsersPage.tsx'))

// Fallback de carregamento
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      Carregando...
    </div>
  )
}

function Page({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  // -- Rotas de tenant ----------------------------------------------------------
  {
    path: '/:slug',
    element: <TenantLayout />,
    children: [
      // Login (publico dentro do tenant)
      {
        path: 'login',
        element: <Page component={LoginPage} />,
      },

      // -- Area do aluno (layout route) -----------------------------------------
      {
        element: (
          <ProtectedRoute role="student">
            <StudentShell />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'learn',
            element: <Page component={StudentDashboardPage} />,
          },
          {
            path: 'learn/:trailId',
            element: <Page component={LearnPage} />,
          },
          {
            path: 'learn/:trailId/module/:moduleId',
            element: <Page component={ChallengePage} />,
          },
          {
            path: 'profile',
            element: <Page component={ProfilePage} />,
          },
          {
            path: 'ranking',
            element: <Page component={RankingPage} />,
          },
        ],
      },

      // -- Area do gestor (layout route) ----------------------------------------
      {
        element: (
          <ProtectedRoute role="manager">
            <ManagerShell />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'manager',
            element: <Page component={ManagerDashboardPage} />,
          },
          {
            path: 'manager/classes',
            element: <Page component={ClassesPage} />,
          },
          {
            path: 'manager/students',
            element: <Page component={StudentsPage} />,
          },
          {
            path: 'manager/settings',
            element: <Page component={SettingsPage} />,
          },
        ],
      },

      // -- Area do super admin (layout route) -----------------------------------
      {
        element: (
          <ProtectedRoute role="super_admin">
            <AdminShell />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'admin/tenants',
            element: <Page component={TenantsPage} />,
          },
          {
            path: 'admin/badges',
            element: <Page component={BadgesPage} />,
          },
          {
            path: 'admin/users',
            element: <Page component={AdminUsersPage} />,
          },
          {
            path: 'admin',
            element: <Navigate to="tenants" replace />,
          },
        ],
      },

      // Redirect raiz do tenant para o local correto (tratado pelo ProtectedRoute)
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
    ],
  },

  // -- Rotas globais ------------------------------------------------------------
  {
    path: '/404',
    element: (
      <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-sans)', color: 'var(--color-text)' }}>
        <h1>Escola nao encontrada</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          Verifique o endereco e tente novamente.
        </p>
      </div>
    ),
  },

  // Qualquer rota nao mapeada redireciona para 404
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
])
