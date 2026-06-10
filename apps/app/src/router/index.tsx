import { createBrowserRouter, Navigate } from 'react-router-dom'
import { TenantLayout } from './TenantLayout.tsx'
import { ProtectedRoute } from './ProtectedRoute.tsx'

// Pages — lazy imports para code splitting
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
  // ── Rotas de tenant ──────────────────────────────────────────────────────────
  {
    path: '/:slug',
    element: <TenantLayout />,
    children: [
      // Login (público dentro do tenant)
      {
        path: 'login',
        element: <Page component={LoginPage} />,
      },

      // ── Área do aluno ────────────────────────────────────────────────────────
      {
        path: 'learn',
        element: (
          <ProtectedRoute role="student">
            <Page component={StudentDashboardPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'learn/:moduleId',
        element: (
          <ProtectedRoute role="student">
            <Page component={LearnPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'learn/:moduleId/challenge/:challengeId',
        element: (
          <ProtectedRoute role="student">
            <Page component={ChallengePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute role="student">
            <Page component={ProfilePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ranking',
        element: (
          <ProtectedRoute role="student">
            <Page component={RankingPage} />
          </ProtectedRoute>
        ),
      },

      // ── Área do gestor ───────────────────────────────────────────────────────
      {
        path: 'manager',
        element: (
          <ProtectedRoute role="manager">
            <Page component={ManagerDashboardPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manager/classes',
        element: (
          <ProtectedRoute role="manager">
            <Page component={ClassesPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manager/students',
        element: (
          <ProtectedRoute role="manager">
            <Page component={StudentsPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'manager/settings',
        element: (
          <ProtectedRoute role="manager">
            <Page component={SettingsPage} />
          </ProtectedRoute>
        ),
      },

      // Redirect raiz do tenant para o local correto (tratado pelo ProtectedRoute)
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
    ],
  },

  // ── Rotas globais ─────────────────────────────────────────────────────────
  {
    path: '/404',
    element: (
      <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-sans)', color: 'var(--color-text)' }}>
        <h1>Escola não encontrada</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          Verifique o endereço e tente novamente.
        </p>
      </div>
    ),
  },

  // Qualquer rota não mapeada redireciona para 404
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
])
